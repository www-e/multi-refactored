import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any
from types import SimpleNamespace  # ✅ Added for safe object creation
from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    extract_conversation_data,
    extract_conversation_id_from_payload
)
from .customer_service import upsert_customer
from .action_service import create_full_interaction_record

logger = logging.getLogger(__name__)

async def process_webhook_payload(db: Session, payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Orchestrates the Webhook -> DB Sync.
    Designed to be 'Crash-Proof' regarding ID mismatches.
    """
    # 1. Basic Validation
    conv_id = extract_conversation_id_from_payload(payload)
    if not conv_id:
        logger.error("❌ Webhook ignored: No conversation_id found.")
        return {"status": "error", "message": "Missing conversation_id"}
    
    logger.info(f"🤖 Processing Webhook for ElevenLabs ID: {conv_id}")

    # 2. Fetch Truth from API
    try:
        data = await fetch_conversation_from_elevenlabs(conv_id)
    except Exception as e:
        logger.error(f"❌ ElevenLabs API Fetch Failed: {e}")
        return {"status": "error", "message": str(e)}

    # 3. Extract Intelligent Data
    data_dict, intent, phone, summary, name, client_ref_id = extract_conversation_data(data)
    
    logger.info(f"🔍 Extracted: Intent='{intent}', Phone='{phone}', RefID='{client_ref_id}'")

    # 4. Strategy: Find the Session (Double Link Strategy)
    session = None
    
    # Strategy A: Try the Client Reference ID (metadata.user_id)
    if client_ref_id:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.id == client_ref_id).first()
        if session:
            logger.info(f"✅ Linked via Client Ref ID: {session.id}")

    # Strategy B: Try the ElevenLabs Conversation ID
    if not session:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conv_id).first()
        if session:
            logger.info(f"✅ Linked via Conversation ID: {session.id}")

    # Determine Tenant
    # We capture this in a local variable to avoid scope ambiguity
    current_tenant_id = session.tenant_id if session else "demo-tenant"

    # 5. UPSERT CUSTOMER
    customer = upsert_customer(db, phone, name, current_tenant_id)
    
    # 6. Update Session or Create Mock Context
    if session:
        # We found the real session, update it
        session.conversation_id = conv_id
        session.customer_id = customer.id
        session.customer_phone = customer.phone
        session.summary = summary
        session.extracted_intent = intent
        session.status = models.VoiceSessionStatus.COMPLETED
        session.ended_at = datetime.now(timezone.utc)
    else:
        # Ghost Session: Create a Mock Object using SimpleNamespace
        # ✅ FIX: This avoids the "NameError" by passing current_tenant_id explicitly
        logger.warning(f"👻 Session not found for {conv_id}. Processing as Ghost Call.")
        
        session = SimpleNamespace(
            id=client_ref_id if client_ref_id else f"ghost_{conv_id[:8]}",
            tenant_id=current_tenant_id,
            conversation_id=conv_id,
            summary=summary,
            created_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc),
            customer_id=customer.id,
            status=models.VoiceSessionStatus.COMPLETED
        )

    # 7. EXECUTE BUSINESS LOGIC
    try:
        create_full_interaction_record(db, session, customer, data_dict)
        
        # Only commit if session is a real DB object
        if hasattr(session, "_sa_instance_state"):
            db.commit()
        else:
            db.commit() # Commits the Customer, Booking, Ticket
            
        logger.info(f"🚀 SUCCESS: Webhook processed for {customer.name}")
        return {
            "status": "success", 
            "customer": customer.name, 
            "action": intent,
            "session_found": hasattr(session, "_sa_instance_state")
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"💥 Critical Failure in Action Service: {e}", exc_info=True)
        return {"status": "error", "message": "Action logic failed"}