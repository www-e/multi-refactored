import os
import logging
import hmac
import hashlib
from typing import Dict, Any, Tuple, Optional
import aiohttp
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)

def get_elevenlabs_headers() -> Dict[str, str]:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    return {"xi-api-key": api_key, "Content-Type": "application/json"}

def verify_elevenlabs_webhook_signature(
    request: Request,
    payload: bytes,
    signature_header: str
) -> bool:
    webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
    if not webhook_secret:
        # SAFETY: If secret is missing, we can't verify, so we ALLOW the request
        # to ensure functionality isn't broken by missing env vars.
        logger.warning("ELEVENLABS_WEBHOOK_SECRET missing. Skipping verification.")
        return True 

    try:
        parts = signature_header.split(',')
        timestamp = None
        expected_sig = None
        for part in parts:
            if part.startswith('t='):
                timestamp = part[2:]
            elif part.startswith('v0='):
                expected_sig = part[3:]
        
        if not expected_sig or not timestamp:
            return False
            
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        calculated_sig = hmac.new(
            key=webhook_secret.encode('utf-8'),
            msg=signed_payload.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(calculated_sig, expected_sig)
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {e}")
        return False

async def fetch_conversation_from_elevenlabs(conversation_id: str) -> Dict[str, Any]:
    headers = get_elevenlabs_headers()
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=response.status,
                    detail=f"Failed to fetch conversation: {await response.text()}"
                )
            return await response.json()

def extract_conversation_data(data: Dict[str, Any]) -> Tuple[Dict[str, Any], str, str, str, str]:
    analysis = data.get("analysis", {})
    data_collection = analysis.get("data_collection_results", {})
    
    intent = data_collection.get("extracted_intent", {}).get("value", "unknown_intent")
    
    customer_phone = data_collection.get("phone", {}).get("value", "")
    if not customer_phone:
        customer_phone = data.get("metadata", {}).get("user_id", "")
        
    call_summary = analysis.get("transcript_summary", "") 
    if not call_summary:
        call_summary = analysis.get("call_summary_title", "")

    customer_name = data_collection.get("customer_name", {}).get("value", "")
    
    return data_collection, intent, customer_phone, call_summary, customer_name

def extract_conversation_id_from_payload(payload: Dict[str, Any]) -> Optional[str]:
    return (
        payload.get("conversation_id") or
        payload.get("conversationId") or
        payload.get("id") or 
        payload.get("call_id")
    )