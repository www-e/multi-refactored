import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any
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
    # 1. Basic Validation: Get the ElevenLabs Conversation ID
    conv_id = extract_conversation_id_from_payload(payload)
    if not conv_id:
        logger.error("❌ Webhook ignored: No conversation_id found.")
        return {"status": "error", "message": "Missing conversation_id"}
    
    logger.info(f"🤖 Processing Webhook for ElevenLabs ID: {conv_id}")

    # 2. Fetch Truth from API (Ensure we have the full analysis)
    try:
        data = await fetch_conversation_from_elevenlabs(conv_id)
    except Exception as e:
        logger.error(f"❌ ElevenLabs API Fetch Failed: {e}")
        return {"status": "error", "message": str(e)}

    # 3. Extract Intelligent Data
    # unpacks: data dict, intent, phone, summary, name, and the critical client_ref_id
    data_dict, intent, phone, summary, name, client_ref_id = extract_conversation_data(data)
    
    logger.info(f"🔍 Extracted: Intent='{intent}', Phone='{phone}', RefID='{client_ref_id}'")

    # 4. Strategy: Find the Session (Double Link Strategy)
    session = None
    
    # Strategy A: Try the Client Reference ID (metadata.user_id) -> This is the local 'vs_...' ID
    if client_ref_id:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.id == client_ref_id).first()
        if session:
            logger.info(f"✅ Linked via Client Ref ID: {session.id}")

    # Strategy B: Try the ElevenLabs Conversation ID (if saved previously)
    if not session:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conv_id).first()
        if session:
            logger.info(f"✅ Linked via Conversation ID: {session.id}")

    # Determine Tenant (Default to demo if unknown)
    tenant_id = session.tenant_id if session else "demo-tenant"

    # 5. UPSERT CUSTOMER (The Anchor)
    # We ALWAYS ensure the customer exists, regardless of whether the session was found.
    # This prevents the "Silent Failure" where data is lost because of a session mismatch.
    customer = upsert_customer(db, phone, name, tenant_id)
    
    # 6. Update Session or Create Mock Context
    if session:
        # We found the real session, update it
        session.conversation_id = conv_id # Ensure this is synced
        session.customer_id = customer.id
        session.customer_phone = customer.phone
        session.summary = summary
        session.extracted_intent = intent
        session.status = models.VoiceSessionStatus.COMPLETED
        session.ended_at = datetime.now(timezone.utc)
    else:
        # Ghost Session: Create a Mock Object to pass to the Action Service
        # This allows the flow to continue even if the DB session record is missing.
        logger.warning(f"👻 Session not found for {conv_id}. Processing as Ghost Call.")
        class MockSession:
            id = client_ref_id if client_ref_id else f"ghost_{conv_id[:8]}"
            tenant_id = tenant_id
            conversation_id = conv_id
            summary = summary
            created_at = datetime.now(timezone.utc)
            ended_at = datetime.now(timezone.utc)
            # We explicitly attach the customer ID here for completeness
            customer_id = customer.id 
            
        session = MockSession()

    # 7. EXECUTE BUSINESS LOGIC
    # We pass the explicitly resolved 'customer' object. 
    # This guarantees the Booking/Ticket uses the correct user ID.
    try:
        create_full_interaction_record(db, session, customer, data_dict)
        
        # Commit Transaction
        # If session is a real DB object, this commits the session updates too.
        # If session is Mock, this still commits the Customer, Booking, and Ticket.
        db.commit()
        
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