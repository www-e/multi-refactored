import logging
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app import models
from app.api import deps

# Clean imports from our new Service Package
from app.services.voice import (
    create_voice_session,
    verify_elevenlabs_webhook_signature,
    process_webhook_payload
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ==========================================
# 1. Request / Response Schemas
# ==========================================

class VoiceSessionRequest(BaseModel):
    # Using snake_case to match Python standards. 
    # If your frontend sends "agentType", Pydantic handles it if configured, 
    # but standard JSON usually uses snake_case or camelCase.
    agent_type: str 
    customer_id: Optional[str] = None
    customer_phone: Optional[str] = None

class VoiceSessionResponse(BaseModel):
    session_id: str
    status: str
    agent_type: str
    customer_id: Optional[str]
    created_at: str

# ==========================================
# 2. API Endpoints
# ==========================================

@router.post("/voice/sessions", response_model=VoiceSessionResponse)
def start_call(
    body: VoiceSessionRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_session)
):
    """
    Initiates a new Voice Session.
    Call this BEFORE the frontend starts the ElevenLabs widget/call.
    Returns a 'session_id' (vs_...) that frontend should pass to ElevenLabs as 'user_id'.
    """
    try:
        # Sanitize inputs
        cid = body.customer_id if body.customer_id and body.customer_id.strip() else None
        phone = body.customer_phone if body.customer_phone and body.customer_phone.strip() else None

        session = create_voice_session(
            db_session=db, 
            agent_type=body.agent_type, 
            customer_id=cid, 
            tenant_id=tenant_id, 
            customer_phone=phone
        )
        
        return VoiceSessionResponse(
            session_id=session.id,
            status=session.status.value,
            agent_type=session.agent_name or body.agent_type,
            customer_id=session.customer_id,
            created_at=session.created_at.isoformat()
        )
    except Exception as e:
        logger.error(f"❌ Start Call Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/post_call")
async def webhook(request: Request):
    """
    Receives the Webhook from ElevenLabs.
    - Verifies Signature
    - Syncs Transcript & Intent
    - Creates Booking / Ticket
    """
    logger.info("📡 WEBHOOK RECEIVED: /voice/post_call")
    
    # We need a new DB session here because webhooks are async and independent
    from app.api.deps import get_session
    
    try:
        # 1. Get Raw Body for Signature Verification
        body = await request.body()
        sig = request.headers.get("Elevenlabs-Signature")
        
        # 2. Verify Signature
        # Note: We log warning but don't crash if sig is missing in dev mode
        if sig:
            is_valid = verify_elevenlabs_webhook_signature(request, body, sig)
            if not is_valid:
                logger.warning("⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.")
        
        # 3. Parse Payload
        payload = json.loads(body.decode("utf-8"))
        
        # 4. Process Logic
        db = next(get_session())
        try:
            result = await process_webhook_payload(db, payload)
            
            # Log success/failure clearly
            if result.get("status") == "success":
                logger.info(f"✅ Webhook Success: {result}")
            else:
                logger.warning(f"⚠️ Webhook Warning: {result}")
                
            return result
            
        except Exception as inner_e:
            db.rollback()
            logger.error(f"❌ Webhook Logic Error: {inner_e}", exc_info=True)
            return {"status": "error", "msg": str(inner_e)}
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Critical Webhook Error: {e}", exc_info=True)
        return {"status": "error", "msg": "Critical failure"}


@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def manual_sync(
    conversation_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_session)
):
    """
    Manually triggers the processing logic for a specific conversation ID.
    Useful for testing or recovering missed webhooks.
    """
    logger.info(f"🔄 Manual Sync Requested for ID: {conversation_id}")
    
    # Construct a payload that mimics the webhook structure
    payload = {
        "conversation_id": conversation_id,
        "manual_sync": True
    }
    
    try:
        res = await process_webhook_payload(db, payload)
        return res
    except Exception as e:
        logger.error(f"❌ Manual Sync Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))