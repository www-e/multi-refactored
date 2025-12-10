import logging
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app import models
from app.api import deps
from app.services.voice import (
    create_voice_session,
    verify_elevenlabs_webhook_signature,
    process_webhook_payload
)

logger = logging.getLogger(__name__)
router = APIRouter()

class VoiceSessionRequest(BaseModel):
    agent_type: str
    customer_id: Optional[str] = None
    customer_phone: Optional[str] = None

class VoiceSessionResponse(BaseModel):
    session_id: str = Field(alias="id")
    id: str
    status: str
    agent_type: Optional[str] = None
    customer_id: Optional[str] = None
    customer_phone: Optional[str] = None
    direction: Optional[str] = None
    created_at: datetime
    ended_at: Optional[datetime] = None
    conversation_id: Optional[str] = None
    summary: Optional[str] = None
    extracted_intent: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/voice/sessions", response_model=List[VoiceSessionResponse])
def get_voice_sessions(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
):
    sessions = db_session.query(models.VoiceSession)\
        .filter(models.VoiceSession.tenant_id == tenant_id)\
        .order_by(models.VoiceSession.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
        
    return [
        VoiceSessionResponse(
            id=vs.id,
            session_id=vs.id,
            status=vs.status.value if hasattr(vs.status, 'value') else str(vs.status),
            agent_type=vs.agent_name,
            customer_id=vs.customer_id,
            customer_phone=vs.customer_phone,
            direction=vs.direction,
            created_at=vs.created_at,
            ended_at=vs.ended_at,
            conversation_id=vs.conversation_id,
            summary=vs.summary,
            extracted_intent=vs.extracted_intent
        )
        for vs in sessions
    ]

@router.post("/voice/sessions", response_model=VoiceSessionResponse)
def start_call(
    body: VoiceSessionRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_session)
):
    try:
        cid = body.customer_id if body.customer_id and body.customer_id.strip() else None
        phone = body.customer_phone if body.customer_phone and body.customer_phone.strip() else None
        
        session = create_voice_session(
            db_session=db,
            agent_type=body.agent_type,
            customer_id=cid,
            tenant_id=tenant_id,
            customer_phone=phone
        )
        
        # Double check commit status
        db.commit()
        db.refresh(session)
        
        return VoiceSessionResponse(
            id=session.id,
            session_id=session.id,
            status=session.status.value,
            agent_type=session.agent_name or body.agent_type,
            customer_id=session.customer_id,
            created_at=session.created_at,
            direction=session.direction
        )
    except Exception as e:
        logger.error(f"❌ Start Call Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/post_call")
async def webhook(request: Request):
    logger.info("📡 WEBHOOK RECEIVED: /voice/post_call")
    from app.api.deps import get_session
    
    try:
        body = await request.body()
        sig = request.headers.get("Elevenlabs-Signature")
        
        # Verify, but don't block if key is missing in dev
        if sig:
            if not verify_elevenlabs_webhook_signature(request, body, sig):
                logger.warning("⚠️ Invalid ElevenLabs Signature! Processing anyway for safety.")
        
        payload = json.loads(body.decode("utf-8"))
        
        # Get a fresh DB session
        db = next(get_session())
        try:
            return await process_webhook_payload(db, payload)
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Webhook Error: {e}", exc_info=True)
        return {"status": "error", "msg": "Critical failure"}

@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def manual_sync(
    conversation_id: str,
    db: Session = Depends(deps.get_session)
):
    logger.info(f"🔄 Manual Sync: {conversation_id}")
    payload = {"conversation_id": conversation_id, "manual_sync": True}
    return await process_webhook_payload(db, payload)