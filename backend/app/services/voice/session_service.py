import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "vs") -> str:
    return f"{prefix}_{secrets.token_hex(8)}"

def create_voice_session(
    db_session: Session,
    agent_type: str,
    customer_id: Optional[str],
    tenant_id: str,
    customer_phone: Optional[str] = None
) -> models.VoiceSession:
    """
    Initializes a session when the call STARTS.
    """
    session_id = generate_id()
    
    voice_session = models.VoiceSession(
        id=session_id,
        tenant_id=tenant_id,
        customer_id=customer_id, 
        customer_phone=customer_phone,
        direction="inbound", 
        status=models.VoiceSessionStatus.ACTIVE,
        agent_name=agent_type,
        
        # ✅ FIX: Explicitly set locale
        locale="ar-SA", 
        
        created_at=datetime.now(timezone.utc)
    )
    
    db_session.add(voice_session)
    db_session.commit()
    db_session.refresh(voice_session)
    
    logger.info(f"📞 Session Started: {session_id} (Agent: {agent_type})")
    return voice_session

def get_voice_session(db_session: Session, session_id: str) -> Optional[models.VoiceSession]:
    return db_session.query(models.VoiceSession).filter(
        models.VoiceSession.id == session_id
    ).first()