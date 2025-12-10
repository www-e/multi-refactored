import os
import logging
import hmac
import hashlib
import json
from typing import Dict, Any, Tuple, Optional
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# Use strict checking for API Key in production
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def get_elevenlabs_headers() -> Dict[str, str]:
    """Returns headers for ElevenLabs API requests."""
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
    """Verifies the HMAC-SHA256 signature of the webhook."""
    if not ELEVENLABS_API_KEY:
        logger.warning("⚠️ ELEVENLABS_API_KEY missing. Skipping signature verification (Unsafe).")
        return True 
    
    try:
        # ElevenLabs sends: "t=timestamp,v1=signature"
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
    """Robustly finds the conversation ID in various payload formats."""
    # 1. Standard Post-Call Webhook (inside 'data')
    if payload.get("data") and isinstance(payload["data"], dict):
        if payload["data"].get("conversation_id"):
            return payload["data"]["conversation_id"]
            
    # 2. Manual Sync / Flat Payload
    return (
        payload.get("conversation_id") or
        payload.get("conversationId") or
        payload.get("id")
    )

async def fetch_conversation_from_elevenlabs(conversation_id: str) -> Dict[str, Any]:
    """Fetches full conversation details from ElevenLabs API."""
    import aiohttp
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
    Extracts critical business data from the complex ElevenLabs JSON.
    Returns: (data_collection, intent, phone, summary, name, client_ref_id)
    """
    analysis = data.get("analysis", {})
    metadata = data.get("metadata", {})
    data_collection = analysis.get("data_collection_results", {})

    # Helper to extraction safe string from {value: "..."} or "..."
    def get_val(key):
        val = data_collection.get(key)
        if isinstance(val, dict):
            return str(val.get("value", "")).strip()
        return str(val if val else "").strip()

    # 1. Extract Business Data
    intent = get_val("extracted_intent") or "unknown"
    phone = get_val("phone")
    name = get_val("customer_name")
    summary = analysis.get("transcript_summary") or analysis.get("call_summary_title", "Voice Interaction")
    
    # 2. Extract Linkage Data (CRITICAL)
    # The 'user_id' in metadata often contains our local 'vs_...' session ID
    client_ref_id = str(metadata.get("user_id", "")).strip()
    
    # 3. Fallback Logic
    # If phone wasn't found in analysis, check metadata (sometimes passed there)
    if not phone and client_ref_id and not client_ref_id.startswith("vs_"):
         # If user_id is NOT a session ID, it might be a phone number
         phone = client_ref_id

    # If client_ref_id doesn't look like a session ID, clear it to avoid bad lookups
    if not client_ref_id.startswith("vs_"):
        client_ref_id = None

    return data_collection, intent, phone, summary, name, client_ref_id