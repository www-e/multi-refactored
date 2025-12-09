"""
Voice API routes
Handles voice session creation and ElevenLabs webhook processing
"""
import os
import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models
from app.api import deps
from app.services.voice.session_service import create_voice_session, update_voice_session_status
from app.services.voice.elevenlabs_service import (
    get_elevenlabs_headers, 
    verify_elevenlabs_webhook_signature,
    fetch_conversation_from_elevenlabs
)
from app.services.voice.webhook_service import process_conversation_webhook, process_webhook_payload

logger = logging.getLogger(__name__)

router = APIRouter()

# --- Pydantic Models ---
class VoiceSessionRequest(BaseModel):
    agent_type: str
    customer_id: str = None  # Make customer_id optional
    customer_phone: str = None  # Phone number from telephony system


class VoiceSessionResponse(BaseModel):
    session_id: str
    status: str
    agent_type: str
    customer_id: str
    created_at: str


# --- Voice Session Endpoint ---
@router.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session_endpoint(
    body: VoiceSessionRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db_session: Session = Depends(deps.get_session)
):
    """
    Create a new voice session
    """
    # Create voice session using service
    voice_session = create_voice_session(
        db_session=db_session,
        agent_type=body.agent_type,
        customer_id=body.customer_id,
        customer_phone=body.customer_phone,
        tenant_id=tenant_id
    )

    return VoiceSessionResponse(
        session_id=voice_session.id,
        status=voice_session.status,
        agent_type=body.agent_type,
        customer_id=voice_session.customer_id,
        created_at=voice_session.created_at.isoformat()
    )


# --- ElevenLabs Endpoints ---
@router.get("/elevenlabs/conversations")
async def fetch_elevenlabs_conversations(_=Depends(deps.get_current_user)):
    """
    Fetch conversations from ElevenLabs
    """
    headers = get_elevenlabs_headers()
    url = "https://api.elevenlabs.io/v1/convai/conversations"
    
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="ElevenLabs API error")
            data = await response.json()
            return {"status": "success", "conversations": data.get("conversations", [])}


@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_fast(
    conversation_id: str,
    db_session: Session = Depends(deps.get_session)
):
    """
    Webhook endpoint for ElevenLabs conversation processing.
    This is an external webhook, so we don't use authentication dependencies.
    Instead, we securely determine tenant context by looking up the existing voice session.
    """
    try:
        result = process_conversation_webhook(db_session, conversation_id)
        return result
    except Exception as e:
        logger.error(f"Error processing conversation {conversation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/post_call")
async def handle_elevenlabs_webhook(request: Request):
    """
    Webhook endpoint for ElevenLabs post-call data.
    Receives webhook calls from ElevenLabs after conversation ends.
    This is an external webhook, so we don't use authentication dependencies.
    Instead, we securely determine tenant context by looking up the existing voice session.
    """
    from app.api.deps import get_session  # Import here to avoid circular dependencies
    logger.info("Received webhook request to /voice/post_call")

    try:
        # Get the raw body for signature verification
        body = await request.body()

        # Get signature from header - ElevenLabs uses "Elevenlabs-Signature"
        signature = request.headers.get("Elevenlabs-Signature") or request.headers.get("X-Elevenlabs-Hmac-SHA256")
        logger.info(f"Webhook signature header received: {bool(signature)}")

        if not signature:
            logger.warning("Webhook request missing Elevenlabs-Signature header")
            # In development, we might want to allow unsigned requests, but in production require signatures
            webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
            if webhook_secret:  # Only require signature if secret is configured
                raise HTTPException(status_code=401, detail="Missing signature header")

        if signature:  # Only verify signature if header exists and secret is configured
            webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
            if webhook_secret:  # Only verify if secret is configured
                if not verify_elevenlabs_webhook_signature(request, body, signature):
                    logger.error("Webhook signature verification failed")
                    raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse the JSON payload
        import json
        try:
            payload = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON in payload")

        # Log the payload keys to understand structure
        logger.info(f"Received ElevenLabs webhook with keys: {list(payload.keys())}")
        logger.info(f"Webhook payload type: {payload.get('type', 'unknown')}")

        # Process the webhook using service
        db_session = next(get_session())
        try:
            result = process_webhook_payload(db_session, payload)
            return result
        except HTTPException:
            db_session.rollback()
            raise
        except Exception as e:
            db_session.rollback()
            logger.error(f"Error processing webhook: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db_session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing ElevenLabs webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing webhook")