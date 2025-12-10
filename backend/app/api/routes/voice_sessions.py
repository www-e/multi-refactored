import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from app import models
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()

class VoiceSessionResponse(BaseModel):
    id: str
    tenant_id: str
    customer_id: str | None
    direction: str
    status: str
    created_at: datetime
    ended_at: datetime | None
    conversation_id: str | None
    agent_name: str | None
    customer_phone: str | None
    summary: str | None
    extracted_intent: str | None

@router.get("/voice-sessions", response_model=List[VoiceSessionResponse])
def get_voice_sessions(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get list of voice sessions for the tenant."""
    voice_sessions = db_session.query(models.VoiceSession)\
        .filter(models.VoiceSession.tenant_id == tenant_id)\
        .order_by(models.VoiceSession.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

    return [
        VoiceSessionResponse(
            id=vs.id,
            tenant_id=vs.tenant_id,
            customer_id=vs.customer_id,
            direction=vs.direction,
            status=vs.status.value if hasattr(vs.status, 'value') else str(vs.status),
            created_at=vs.created_at,
            ended_at=vs.ended_at,
            conversation_id=vs.conversation_id,
            agent_name=vs.agent_name,
            customer_phone=vs.customer_phone,
            summary=vs.summary,
            extracted_intent=vs.extracted_intent
        )
        for vs in voice_sessions
    ]

# Register this router in the main API file