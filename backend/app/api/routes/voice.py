# File: backend/app/api/routes/voice.py
# Action: OVERWRITE COMPLETE FILE

import os
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app import models
from app.api import deps
from app.services.voice.session_service import create_voice_session
from app.services.voice.elevenlabs_service import (
    get_elevenlabs_headers,
    verify_elevenlabs_webhook_signature,
)
from app.services.voice.webhook_service import process_webhook_payload, process_conversation_webhook

logger = logging.getLogger(__name__)
router = APIRouter()

class VoiceSessionRequest(BaseModel):
    agent_type: str
    customer_id: Optional[str] = None
    customer_phone: Optional[str] = None

class VoiceSessionResponse(BaseModel):
    session_id: str
    status: str
    agent_type: str
    customer_id: Optional[str]
    created_at: str

@router.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session_endpoint(
    body: VoiceSessionRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db_session: Session = Depends(deps.get_session)
):
    try:
        # Sanitize customer_id: Convert empty strings to None to prevent Foreign Key errors
        safe_customer_id = body.customer_id
        if safe_customer_id and not safe_customer_id.strip():
            safe_customer_id = None

        logger.info(f"Creating voice session. Agent: {body.agent_type}, CustID: {safe_customer_id}")

        voice_session = create_voice_session(
            db_session=db_session,
            agent_type=body.agent_type,
            customer_id=safe_customer_id,
            customer_phone=body.customer_phone,
            tenant_id=tenant_id
        )
        
        return VoiceSessionResponse(
            session_id=voice_session.id,
            status=voice_session.status.value,
            agent_type=body.agent_type,
            customer_id=voice_session.customer_id,
            created_at=voice_session.created_at.isoformat()
        )
    except Exception as e:
        logger.error(f"Failed to create voice session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/voice/post_call")
async def handle_elevenlabs_webhook(request: Request):
    from app.api.deps import get_session
    logger.info("Received webhook request to /voice/post_call")
    
    try:
        body = await request.body()
        signature = request.headers.get("Elevenlabs-Signature") or request.headers.get("X-Elevenlabs-Hmac-SHA256")
        
        # Optional: Verify signature if secret is set
        webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
        if webhook_secret and signature:
            if not verify_elevenlabs_webhook_signature(request, body, signature):
                logger.error("Webhook signature verification failed")
                raise HTTPException(status_code=401, detail="Invalid signature")

        import json
        try:
            payload = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")

        # Use a fresh DB session for the webhook
        db_session = next(get_session())
        try:
            result = await process_webhook_payload(db_session, payload)
            return result
        except Exception as e:
            db_session.rollback()
            logger.error(f"Error processing webhook logic: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db_session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Critical Webhook Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unknown error processing webhook")

@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_manual(
    conversation_id: str,
    db_session: Session = Depends(deps.get_session)
):
    try:
        # Re-use the exact same logic as the webhook
        result = await process_conversation_webhook(db_session, conversation_id)
        return result
    except Exception as e:
        logger.error(f"Manual sync failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/sessions/{session_id}/end")
async def end_voice_session(
    session_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db_session: Session = Depends(deps.get_session)
):
    from datetime import datetime, timezone
    try:
        voice_session = db_session.query(models.VoiceSession).filter(
            models.VoiceSession.id == session_id,
            models.VoiceSession.tenant_id == tenant_id
        ).first()
        
        if not voice_session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        voice_session.status = models.VoiceSessionStatus.COMPLETED
        if not voice_session.ended_at:
            voice_session.ended_at = datetime.now(timezone.utc)
        
        db_session.commit()
        return {"status": "success", "message": "Session ended"}
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))