"""
Voice session management service
Handles creation, management, and persistence of voice sessions
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models
from app.api.deps import get_current_tenant_id

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

def create_voice_session(db_session: Session, agent_type: str, customer_id: Optional[str], tenant_id: str, customer_phone: Optional[str] = None) -> models.VoiceSession:
    """
    Create a new voice session WITHOUT a customer.
    Customer will be created later when webhook processes the conversation with real data.
    """
    # Create Voice Session with NO customer (customer_id = None)
    voice_session = models.VoiceSession(
        id=generate_id("vs"),
        tenant_id=tenant_id,
        customer_id=None,  # Will be set by webhook after data extraction
        direction="inbound",
        status=models.VoiceSessionStatus.ACTIVE,
        customer_phone=customer_phone,
        created_at=datetime.now(timezone.utc)
    )

    # Set the conversation_id to match the session ID so webhook can find this session
    voice_session.conversation_id = voice_session.id
    db_session.add(voice_session)
    db_session.commit()
    db_session.refresh(voice_session)

    return voice_session


def get_voice_session(db_session: Session, session_id: str, tenant_id: str) -> Optional[models.VoiceSession]:
    """
    Retrieve a voice session by ID and tenant
    """
    return (
        db_session.query(models.VoiceSession)
        .filter(
            models.VoiceSession.id == session_id,
            models.VoiceSession.tenant_id == tenant_id
        )
        .first()
    )


def update_voice_session_status(
    db_session: Session,
    session_id: str,
    status: models.VoiceSessionStatus,
    summary: Optional[str] = None,
    customer_phone: Optional[str] = None,
    extracted_intent: Optional[str] = None
) -> bool:
    """
    Update voice session status and other fields
    """
    voice_session = (
        db_session.query(models.VoiceSession)
        .filter(models.VoiceSession.id == session_id)
        .first()
    )

    if not voice_session:
        return False

    voice_session.status = status
    if summary is not None:
        voice_session.summary = summary
    if customer_phone:
        voice_session.customer_phone = customer_phone
    if extracted_intent:
        voice_session.extracted_intent = extracted_intent
    if status == models.VoiceSessionStatus.COMPLETED:
        if not voice_session.ended_at:
            voice_session.ended_at = datetime.now(timezone.utc)

    # Ensure created_at is set if not already set
    if not voice_session.created_at:
        voice_session.created_at = datetime.now(timezone.utc)

    db_session.commit()
    return True