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

    # Look for messages in conversation data
    messages = conversation_data.get("messages", [])

    # If messages not found, try 'user_transcript' or 'agent_transcript'
    if not messages:
        user_transcript = conversation_data.get("user_transcript", [])
        agent_transcript = conversation_data.get("agent_transcript", [])

        # Combine both if they exist
        for ut in user_transcript:
            transcript.append({
                "role": "user",
                "text": ut.get("text", ""),
                "timestamp": ut.get("time_in_call_secs", 0)
            })

        for at in agent_transcript:
            transcript.append({
                "role": "assistant",
                "text": at.get("text", ""),
                "timestamp": at.get("time_in_call_secs", 0)
            })
    else:
        # Process standard messages format
        for msg in messages:
            transcript.append({
                "role": msg.get("role", "unknown"),
                "text": msg.get("text", ""),
                "timestamp": msg.get("time_in_call_secs", 0)
            })

    # Sort by timestamp if available
    transcript.sort(key=lambda x: x.get("timestamp", 0))

    return transcript

def check_transcript_availability(data: Dict[str, Any]) -> bool:
    """
    Checks if transcript is available in the ElevenLabs conversation data.
    Returns: Boolean indicating if transcript is available
    """
    # Try different possible locations for transcript data
    conversation_data = data.get("conversation", {})
    if not conversation_data:
        conversation_data = data

    # Check if messages exist
    messages = conversation_data.get("messages", [])
    if messages:
        return True

    # Check if user or agent transcripts exist
    user_transcript = conversation_data.get("user_transcript", [])
    agent_transcript = conversation_data.get("agent_transcript", [])

    return len(user_transcript) > 0 or len(agent_transcript) > 0

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