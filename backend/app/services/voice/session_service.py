# File: backend/app/services/voice/session_service.py
# Action: OVERWRITE COMPLETE FILE

import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

def create_voice_session(
    db_session: Session, 
    agent_type: str, 
    customer_id: Optional[str], 
    tenant_id: str, 
    customer_phone: Optional[str] = None
) -> models.VoiceSession:
    
    # SAFETY CHECK: Ensure customer_id is None if it's empty string
    # This prevents the "Foreign Key Violation" error
    if customer_id == "":
        customer_id = None
        
    voice_session = models.VoiceSession(
        id=generate_id("vs"),
        tenant_id=tenant_id,
        customer_id=customer_id,
        direction="inbound", # Assume inbound for AI agent calls initiated by user
        status=models.VoiceSessionStatus.ACTIVE,
        customer_phone=customer_phone,
        agent_name=agent_type,
        created_at=datetime.now(timezone.utc)
    )
    
    # For ElevenLabs, the session ID is often used as the conversation ID initially
    voice_session.conversation_id = voice_session.id
    
    db_session.add(voice_session)
    db_session.commit()
    db_session.refresh(voice_session)
    
    logger.info(f"Created VoiceSession {voice_session.id} for Customer {customer_id}")
    return voice_session

def get_voice_session(db_session: Session, session_id: str, tenant_id: str) -> Optional[models.VoiceSession]:
    return db_session.query(models.VoiceSession).filter(
        models.VoiceSession.id == session_id,
        models.VoiceSession.tenant_id == tenant_id
    ).first()