import os
import logging
import hmac
import hashlib
import json
from typing import Dict, Any, Tuple, Optional
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

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

    intent = get_val("extracted_intent") or "unknown"
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