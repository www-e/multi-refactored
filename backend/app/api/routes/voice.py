import logging
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app import models
from app.api import deps
from app.services.voice.session_service import create_voice_session
from app.services.voice.elevenlabs_service import verify_elevenlabs_webhook_signature
from app.services.voice.webhook_service import process_webhook_payload

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
def start_call(
    body: VoiceSessionRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_session)
):
    try:
        cid = body.customer_id if body.customer_id and body.customer_id.strip() else None
        session = create_voice_session(db, body.agent_type, cid, tenant_id, body.customer_phone)
        return VoiceSessionResponse(
            session_id=session.id,
            status=session.status.value,
            agent_type=body.agent_type,
            customer_id=session.customer_id,
            created_at=session.created_at.isoformat()
        )
    except Exception as e:
        logger.error(f"Start Call Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/post_call")
async def webhook(request: Request):
    logger.info("📡 WEBHOOK RECEIVED")
    from app.api.deps import get_session
    
    try:
        body = await request.body()
        sig = request.headers.get("Elevenlabs-Signature")
        
        # In production, you might enforce this check strictly
        if sig and not verify_elevenlabs_webhook_signature(request, body, sig):
            logger.warning("⚠️ Signature verification failed (allowing for now)")
            
        payload = json.loads(body.decode("utf-8"))
        
        # Manually get a DB session since this is a webhook
        db = next(get_session())
        try:
            res = await process_webhook_payload(db, payload)
            return res
        except Exception as e:
            db.rollback()
            logger.error(f"Webhook Logic Error: {e}", exc_info=True)
            return {"status": "error", "msg": str(e)}
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Critical Webhook Error: {e}")
        return {"status": "error", "msg": "Critical failure"}

# --- Added Manual Sync Endpoint ---
@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def manual_sync(
    conversation_id: str,
    request: Request,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_session)
):
    """
    Manually triggers the webhook processing logic for a specific conversation ID.
    Used by the frontend Playground to sync data if the webhook fails or is delayed.
    """
    logger.info(f"🔄 Manual Sync Requested for ID: {conversation_id}")
    
    # Construct a mock payload that mimics the ElevenLabs webhook structure
    # minimal payload required by extract_conversation_id_from_payload
    payload = {
        "conversation_id": conversation_id,
        "manual_sync": True 
    }
    
    try:
        res = await process_webhook_payload(db, payload)
        return res
    except Exception as e:
        logger.error(f"Manual Sync Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))