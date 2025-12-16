import os
import logging
import hmac
import hashlib
import json
from typing import Dict, Any, Tuple, Optional, List
from fastapi import Request, HTTPException
import aiohttp

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
SUPPORT_AGENT_ID = os.getenv("ELEVENLABS_SUPPORT_AGENT_ID")
SALES_AGENT_ID = os.getenv("ELEVENLABS_SALES_AGENT_ID")

def get_elevenlabs_headers() -> Dict[str, str]:
    if not ELEVENLABS_API_KEY:
        logger.error("❌ ELEVENLABS_API_KEY is missing from environment variables")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing API Key")
    return {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }

def verify_elevenlabs_webhook_signature(
    request: Request,
    body: bytes,
    signature: str
) -> bool:
    if not ELEVENLABS_API_KEY:
        logger.warning("⚠️ ELEVENLABS_API_KEY missing. Skipping signature verification (Unsafe).")
        return True

    try:
        parts = signature.split(',')
        timestamp = None
        expected_sig = None
        for part in parts:
            if part.startswith('t='):
                timestamp = part[2:]
            elif part.startswith('v1='):
                expected_sig = part[3:]

        if not expected_sig or not timestamp:
            return False

        signed_payload = f"{timestamp}.{body.decode('utf-8')}"
        calculated_sig = hmac.new(
            key=ELEVENLABS_API_KEY.encode('utf-8'),
            msg=signed_payload.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(calculated_sig, expected_sig)
    except Exception as e:
        logger.error(f"❌ Signature verification error: {e}")
        return False

def extract_conversation_id_from_payload(payload: Dict[str, Any]) -> Optional[str]:
    if payload.get("data") and isinstance(payload["data"], dict):
        if payload["data"].get("conversation_id"):
            return payload["data"]["conversation_id"]

    return (
        payload.get("conversation_id") or
        payload.get("conversationId") or
        payload.get("id")
    )

async def fetch_conversation_from_elevenlabs(conversation_id: str) -> Dict[str, Any]:
    headers = get_elevenlabs_headers()
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                error_txt = await response.text()
                logger.error(f"❌ API Error {response.status}: {error_txt}")
                raise HTTPException(status_code=response.status, detail="Failed to fetch conversation")
            return await response.json()

def extract_conversation_data(data: Dict[str, Any]) -> Tuple[Dict, str, str, str, str, Optional[str]]:
    """
    Extracts key data points from the ElevenLabs conversation object.
    Returns: (data_collection, intent, phone, summary, customer_name, client_ref_id)
    """
    analysis = data.get("analysis", {})
    metadata = data.get("metadata", {})
    data_collection = analysis.get("data_collection_results", {})

    # Helper to safely get string values
    def get_val(key):
        val = data_collection.get(key)
        if isinstance(val, dict):
            return str(val.get("value", "")).strip()
        return str(val if val else "").strip()

    # Handle extracted_intent which may be a string, dict, or other complex type
    intent_raw = data_collection.get("extracted_intent")
    if isinstance(intent_raw, dict):
        # Extract the value from dict if it's a complex object
        intent = intent_raw.get("value") or str(intent_raw)
    elif intent_raw is not None:
        intent = str(intent_raw)
    else:
        intent = "unknown"
    phone = get_val("phone")
    name = get_val("customer_name")
    summary = analysis.get("transcript_summary") or analysis.get("call_summary_title", "Voice Interaction")

    # Robust extraction of client reference ID
    # ElevenLabs sometimes puts it in 'user_id' or 'custom_LLM_metadata'
    client_ref_id = str(metadata.get("user_id", "")).strip()

    # Log metadata for debugging context
    if not client_ref_id:
        logger.debug(f"🔍 Metadata Dump: {json.dumps(metadata)}")

    # Heuristic: If ID looks like a phone number, it's not a session ID
    if client_ref_id and len(client_ref_id) < 15 and client_ref_id.isdigit():
        if not phone:
            phone = client_ref_id
        client_ref_id = None

    return data_collection, intent, phone, summary, name, client_ref_id


def extract_transcript_from_conversation(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extracts transcript from ElevenLabs conversation data.
    Returns: List of transcript entries with role, text, and timestamp
    """
    transcript = []

    # Try different possible locations for transcript data
    conversation_data = data.get("conversation", {})
    if not conversation_data:
        conversation_data = data

    # Debug: Log the structure of the data we received
    logger.debug(f"🔍 ElevenLabs response structure keys: {list(conversation_data.keys()) if conversation_data else 'empty'}")

    # Based on analysis of elevenlabsextracted.md and common structures, check multiple locations
    # Look for messages in various possible locations
    messages = conversation_data.get("messages", [])
    logger.debug(f"🔍 Found {len(messages)} messages in 'messages' field")

    # If messages not found, try other common fields
    if not messages:
        # Check for the transcript structure as seen in elevenlabsextracted.md
        # May be in various formats like "conversation" -> "messages" or flat structure
        if isinstance(conversation_data, list):
            # If conversation_data is directly a list of messages
            messages = conversation_data
        else:
            # Check common fields that might contain the conversation transcript
            for field_name in ["messages", "conversation", "transcript", "dialogue"]:
                if field_name in conversation_data and isinstance(conversation_data[field_name], list):
                    messages = conversation_data[field_name]
                    logger.debug(f"🔍 Found {len(messages)} messages in '{field_name}' field")
                    break

        # If still no messages found, try more specific formats
        if not messages:
            # Check for structure like in elevenlabsextracted.md where we have turns
            turns = conversation_data.get("turns", []) or conversation_data.get("conversation_turns", [])
            if turns:
                logger.debug(f"🔍 Found {len(turns)} turns in conversation")
                for turn in turns:
                    role = "user" if turn.get("speaker", "").lower() in ["user", "customer", "caller"] else "assistant"
                    transcript.append({
                        "role": role,
                        "text": turn.get("text", turn.get("message", turn.get("content", ""))),
                        "timestamp": turn.get("timestamp", turn.get("time", turn.get("time_in_call_secs", 0)))
                    })

            if transcript:
                logger.debug(f"📊 Extracted {len(transcript)} entries from turns")
                # Sort by timestamp if available
                transcript.sort(key=lambda x: x.get("timestamp", 0))
                return transcript

            # Try to extract from freeform text that might have timestamp-like patterns
            # This handles cases where transcript is provided as a structured text rather than discrete messages
            # Looking for patterns like "0:00" "0:06" "0:27" as seen in elevenlabsextracted.md
            full_text = conversation_data.get("full_text", "") or conversation_data.get("summary", "")
            if full_text and not transcript:
                # Try to parse timestamped conversation from text
                import re
                # Look for timestamp patterns like "0:00" followed by text
                timestamp_pattern = r'(\d+:\d+)\s*(.*?)(?=\d+:\d+|$)'
                matches = re.findall(timestamp_pattern, full_text, re.DOTALL)
                if matches:
                    current_speaker = "assistant"  # Start with assistant as typically the first in the file is M7senNew subagent
                    for timestamp, content in matches:
                        # Simple heuristic to identify speaker changes based on text content
                        # In the example, we see "M7senNew subagent" followed by content
                        if "agent" in content.lower() or "ممثل" in content.lower():
                            current_speaker = "assistant"
                        else:
                            current_speaker = "user"

                        # Extract just the meaningful content, removing speaker labels
                        content_text = re.sub(r'^.*?subagent\s*', '', content, flags=re.DOTALL).strip()
                        content_text = re.sub(r'^.*?ممثل.*?\d+:\d+\s*', '', content_text, flags=re.DOTALL).strip()

                        if content_text:
                            # Convert timestamp to seconds: "0:27" -> 27 seconds, "1:30" -> 90 seconds
                            time_parts = timestamp.split(':')
                            if len(time_parts) == 2:
                                seconds = int(time_parts[0]) * 60 + int(time_parts[1])
                            else:
                                seconds = 0

                            transcript.append({
                                "role": current_speaker,
                                "text": content_text,
                                "timestamp": seconds
                            })

    # Process messages if found
    if messages:
        logger.debug(f"🔍 Processing {len(messages)} messages from primary source")
        for msg in messages:
            if isinstance(msg, dict):
                # Standard message object format
                role = msg.get("role", msg.get("speaker", "unknown"))
                # Normalize roles to match frontend expectations
                if role.lower() in ["user", "customer", "caller", "human"]:
                    role = "user"
                elif role.lower() in ["assistant", "agent", "ai", "subagent"]:
                    role = "assistant"

                transcript.append({
                    "role": role,
                    "text": msg.get("text", msg.get("content", msg.get("message", ""))),
                    "timestamp": msg.get("time_in_call_secs", msg.get("timestamp", msg.get("time", 0)))
                })
            else:
                # Handle if individual message is not a dict
                logger.warning(f"🔍 Unexpected message format: {type(msg)}")

    # If still no transcript found from main sources, check in analysis or other nested structures
    if not transcript:
        # Check in analysis section for detailed conversation data
        analysis = data.get("analysis", {})
        if analysis and isinstance(analysis, dict):
            # Check if transcript data might be in data collection results or other analysis fields
            data_collection = analysis.get("data_collection_results", {})
            if data_collection:
                # Some implementations store conversation details here
                pass

        # Check if there's a detailed conversation structure elsewhere in the response
        for key, value in data.items():
            if isinstance(value, list) and key.lower() != "messages":
                # Potential list of conversation turns
                potential_messages = True
                for item in value:
                    if not isinstance(item, dict) or not any(k in item for k in ["text", "message", "content"]):
                        potential_messages = False
                        break
                if potential_messages and len(value) > 0:
                    logger.debug(f"🔍 Found potential messages in field '{key}': {len(value)} items")
                    for msg in value:
                        role = msg.get("role", msg.get("speaker", "unknown"))
                        if role.lower() in ["user", "customer", "caller", "human"]:
                            role = "user"
                        elif role.lower() in ["assistant", "agent", "ai"]:
                            role = "assistant"

                        transcript.append({
                            "role": role,
                            "text": msg.get("text", msg.get("content", msg.get("message", ""))),
                            "timestamp": msg.get("time_in_call_secs", msg.get("timestamp", 0))
                        })
                    break

    # Sort by timestamp if available
    transcript.sort(key=lambda x: x.get("timestamp", 0))

    logger.debug(f"📊 Total transcript entries extracted: {len(transcript)}")
    return transcript

def extract_recording_url_from_conversation(data: Dict[str, Any]) -> Optional[str]:
    """
    Extracts recording URL from ElevenLabs conversation data.
    Returns: Recording URL string or None if not available
    """
    logger.debug(f"🔍 ElevenLabs response for recording URL - top level keys: {list(data.keys()) if data else 'empty'}")

    # Comprehensive search for recording URLs in various possible locations
    def find_url_recursive(obj, path=""):
        """Recursively search for URL strings in nested data structure"""
        if isinstance(obj, str) and obj.startswith('http'):
            if any(keyword in obj.lower() for keyword in ['recording', 'audio', 'download', 'playback', 'file', 'mp3', 'wav', 'm4a']):
                return obj
        elif isinstance(obj, dict):
            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                result = find_url_recursive(value, new_path)
                if result:
                    logger.info(f"🔍 Found URL via recursive search at {new_path}: {result[:50]}...")
                    return result
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = f"{path}[{i}]" if path else f"[{i}]"
                result = find_url_recursive(item, new_path)
                if result:
                    return result
        return None

    # Try different possible locations for recording URL in ElevenLabs response
    recording_url = data.get("recording_url")
    if recording_url:
        logger.info(f"🔍 Found recording URL in 'recording_url' field: {recording_url[:50]}...")
        return recording_url

    # Check for various related field names
    for field_name in ["recording_url", "audio_url", "download_url", "playback_url", "file_url", "url"]:
        url = data.get(field_name)
        if url and isinstance(url, str) and url.startswith('http'):
            logger.info(f"🔍 Found URL in '{field_name}' field: {url[:50]}...")
            return url

    # Check in metadata
    metadata = data.get("metadata", {})
    if metadata:
        for field_name in ["recording_url", "audio_url", "download_url", "playback_url", "file_url", "url"]:
            recording_url = metadata.get(field_name)
            if recording_url and isinstance(recording_url, str) and recording_url.startswith('http'):
                logger.info(f"🔍 Found recording URL in metadata.{field_name}: {recording_url[:50]}...")
                return recording_url

    # Check in analysis section
    analysis = data.get("analysis", {})
    if analysis:
        for field_name in ["recording_url", "audio_url", "download_url", "playback_url", "file_url", "url", "conversation_url"]:
            recording_url = analysis.get(field_name)
            if recording_url and isinstance(recording_url, str) and recording_url.startswith('http'):
                logger.info(f"🔍 Found recording URL in analysis.{field_name}: {recording_url[:50]}...")
                return recording_url

    # Check in conversation section
    conversation_data = data.get("conversation", {})
    if conversation_data and isinstance(conversation_data, dict):
        for field_name in ["recording_url", "audio_url", "download_url", "playback_url", "file_url", "url", "conversation_url"]:
            recording_url = conversation_data.get(field_name)
            if recording_url and isinstance(recording_url, str) and recording_url.startswith('http'):
                logger.info(f"🔍 Found recording URL in conversation.{field_name}: {recording_url[:50]}...")
                return recording_url

    # Common ElevenLabs API fields that might contain recording URLs
    elevenlabs_fields = [
        "conversation_recording_url",
        "audio_recording_url",
        "recording_download_url",
        "conversation_audio_url",
        "call_recording_url",
        "voice_recording_url",
        "recording_file_url",
        "audio_file_url",
        "conversation_file_url"
    ]

    for field in elevenlabs_fields:
        url = data.get(field)
        if url and isinstance(url, str) and url.startswith('http'):
            logger.info(f"🔍 Found potential recording URL in '{field}': {url[:50]}...")
            return url

    # Check if there are nested structures that might contain recordings
    # Check conversation.turns or similar for per-turn audio
    if "conversation" in data and isinstance(data["conversation"], dict):
        conversation = data["conversation"]
        if "turns" in conversation and isinstance(conversation["turns"], list):
            # Check individual turns for audio URLs
            for i, turn in enumerate(conversation["turns"]):
                if isinstance(turn, dict):
                    for field_name in ["audio_url", "recording_url", "url", "audio_file", "recording_file"]:
                        turn_url = turn.get(field_name)
                        if turn_url and isinstance(turn_url, str) and turn_url.startswith('http'):
                            logger.info(f"🔍 Found recording URL in conversation.turns[{i}].{field_name}: {turn_url[:50]}...")
                            return turn_url

    # Check for URLs related to specific conversation ID
    # Based on the logs, the conversation ID is conv_3201kch2yphkf1js35abe0j8hebm
    conversation_id = extract_conversation_id_from_payload(data) or data.get('conversation_id')
    if conversation_id:
        # Look for URLs that contain the conversation ID
        for key, value in data.items():
            if isinstance(value, str) and value.startswith('http') and conversation_id in value:
                logger.info(f"🔍 Found conversation ID related URL in {key}: {value[:50]}...")
                return value

        # Look recursively for URLs containing the conversation ID
        def find_by_conversation_id(obj, path=""):
            if isinstance(obj, str) and obj.startswith('http') and conversation_id in obj:
                logger.info(f"🔍 Found conversation ID matching URL via search at {path}: {obj[:50]}...")
                return obj
            elif isinstance(obj, dict):
                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    result = find_by_conversation_id(value, new_path)
                    if result:
                        return result
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    new_path = f"{path}[{i}]" if path else f"[{i}]"
                    result = find_by_conversation_id(item, new_path)
                    if result:
                        return result
            return None

        by_conv_id = find_by_conversation_id(data)
        if by_conv_id:
            return by_conv_id

    # Additional check: Look for URLs in the main conversation object that might have audio extensions
    for key, value in data.items():
        if isinstance(value, str) and value.startswith('http'):
            if any(ext in value.lower() for ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac']):
                logger.info(f"🔍 Found audio recording URL in {key}: {value[:50]}...")
                return value

    # Use recursive search as a last resort
    recursive_result = find_url_recursive(data)
    if recursive_result:
        return recursive_result

    # Final fallback: look for any URL that might be related to recordings
    # Sometimes recording URLs are nested in unexpected places
    def find_any_recording_url(obj):
        if isinstance(obj, str) and obj.startswith('http'):
            if any(keyword in obj.lower() for keyword in ['recording', 'audio', 'download', 'playback', 'file', 'mp3', 'wav', 'm4a']):
                return obj
        elif isinstance(obj, dict):
            for key, value in obj.items():
                if isinstance(key, str) and any(kw in key.lower() for kw in ['recording', 'audio', 'download']):
                    if isinstance(value, str) and value.startswith('http'):
                        return value
                result = find_any_recording_url(value)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = find_any_recording_url(item)
                if result:
                    return result
        return None

    fallback_result = find_any_recording_url(data)
    if fallback_result:
        logger.info(f"🔍 Found recording URL via fallback search: {fallback_result[:50]}...")
        return fallback_result

    # Even more extensive search: Check for nested objects that might contain recording URLs
    def deep_search(obj, path=""):
        if isinstance(obj, str) and obj.startswith('http'):
            # Look for URLs that might be recordings even without explicit keywords
            if any(ext in obj.lower() for ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac']):
                logger.info(f"🔍 Found audio file URL via deep search at {path}: {obj[:50]}...")
                return obj
        elif isinstance(obj, dict):
            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                result = deep_search(value, new_path)
                if result:
                    return result
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = f"{path}[{i}]" if path else f"[{i}]"
                result = deep_search(item, new_path)
                if result:
                    return result
        return None

    deep_result = deep_search(data)
    if deep_result:
        return deep_result

    # Additional search for file objects that might contain audio URLs
    def search_file_objects(obj, path=""):
        if isinstance(obj, dict):
            # Check if this looks like a file object with URL
            if 'url' in obj and 'name' in obj and isinstance(obj['url'], str) and obj['url'].startswith('http'):
                if any(ext in obj['name'].lower() for ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac']):
                    logger.info(f"🔍 Found audio file object at {path}: {obj['name']} -> {obj['url'][:50]}...")
                    return obj['url']

            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                result = search_file_objects(value, new_path)
                if result:
                    return result
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = f"{path}[{i}]" if path else f"[{i}]"
                result = search_file_objects(item, new_path)
                if result:
                    return result
        return None

    file_result = search_file_objects(data)
    if file_result:
        return file_result

    logger.info(f"🔍 No recording URL found in ElevenLabs response for conversation {conversation_id}")
    return None

def check_transcript_availability(data: Dict[str, Any]) -> bool:
    """
    Checks if transcript is available in the ElevenLabs conversation data.
    Returns: Boolean indicating if transcript is available
    """
    # Instead of just checking for existence, use the same comprehensive extraction
    # and check if any transcript data exists
    transcript = extract_transcript_from_conversation(data)
    return len(transcript) > 0

async def send_text_to_elevenlabs_agent(message: str, agent_type: str, session_id: Optional[str] = None) -> str:
    """
    Send a text message to ElevenLabs agent and get response.
    """
    if not ELEVENLABS_API_KEY:
        logger.error("❌ ELEVENLABS_API_KEY is missing")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing API Key")

    agent_id = SUPPORT_AGENT_ID if agent_type == 'support' else SALES_AGENT_ID
    if not agent_id:
        raise HTTPException(status_code=500, detail=f"Agent ID not configured for {agent_type}")

    headers = get_elevenlabs_headers()

    # Prepare the payload for text chat
    payload = {
        "text": message,
        "agent_id": agent_id,
        "session_id": session_id or None
    }

    url = "https://api.elevenlabs.io/v1/convai/chat"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"❌ ElevenLabs API Error {response.status}: {error_text}")
                    raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")

                result = await response.json()
                # Extract the AI response text
                ai_response = result.get('response', result.get('text', ''))
                return ai_response
    except Exception as e:
        logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI response: {str(e)}")

async def start_text_conversation(agent_type: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Start a new text-based conversation with ElevenLabs agent.
    """
    if not ELEVENLABS_API_KEY:
        logger.error("❌ ELEVENLABS_API_KEY is missing")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing API Key")

    agent_id = SUPPORT_AGENT_ID if agent_type == 'support' else SALES_AGENT_ID
    if not agent_id:
        raise HTTPException(status_code=500, detail=f"Agent ID not configured for {agent_type}")

    headers = get_elevenlabs_headers()

    # Prepare the payload for starting a conversation
    payload = {
        "agent_id": agent_id,
        "session_id": session_id or None,
        "require_auth": False  # For text chat, we don't necessarily need auth
    }

    url = "https://api.elevenlabs.io/v1/convai/conversations"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"❌ ElevenLabs API Error {response.status}: {error_text}")
                    raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")

                result = await response.json()
                return result
    except Exception as e:
        logger.error(f"❌ Error starting ElevenLabs conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")


async def fetch_conversation_recording(conversation_id: str) -> Optional[str]:
    """
    Fetch conversation recording URL from ElevenLabs if available.
    This is a fallback method when recording URL is not provided in webhook payload.

    According to ElevenLabs documentation, the audio can be retrieved from:
    GET https://api.elevenlabs.io/v1/convai/conversations/:conversation_id/audio
    """
    headers = get_elevenlabs_headers()

    # The correct endpoint according to ElevenLabs API documentation
    audio_url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio"

    try:
        # Check if audio is available by making a HEAD request first to avoid downloading large files unnecessarily
        async with aiohttp.ClientSession() as session:
            async with session.head(audio_url, headers=headers) as response:
                if response.status == 200:
                    # Audio is available, return the download URL
                    logger.info(f"✅ Found conversation audio at official endpoint: {conversation_id}")
                    return audio_url
                elif response.status == 422:
                    # The request wasn't processable, may not have audio available
                    logger.debug(f"⚠️ No audio available for conversation {conversation_id} (422 error)")
                elif response.status == 404:
                    # Audio endpoint doesn't exist or no recording available
                    logger.debug(f"⚠️ Audio endpoint not found for conversation {conversation_id}")
                else:
                    logger.warning(f"⚠️ Unexpected status from audio endpoint {response.status} for {conversation_id}")

    except Exception as e:
        logger.debug(f"ℹ️ Audio endpoint not available for {conversation_id}, error: {e}")

    # If no recording found through the official endpoint, return None
    logger.info(f"ℹ️ No recording found for conversation {conversation_id} at official audio endpoint")
    return None