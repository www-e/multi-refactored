import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    extract_conversation_data,
    extract_conversation_id_from_payload
)
from .customer_service import get_or_create_customer
from .action_service import (
    create_booking_from_conversation,
    create_ticket_from_conversation,
    create_history_records
)

logger = logging.getLogger(__name__)

async def process_webhook_payload(db_session: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    conversation_id = extract_conversation_id_from_payload(payload)
    if not conversation_id:
        return {"status": "error", "reason": "no_conversation_id"}
    return await process_conversation_webhook(db_session, conversation_id)

async def process_conversation_webhook(db_session: Session, conversation_id: str) -> Dict[str, Any]:
    logger.info(f"🔄 PROCESSING WEBHOOK LOGIC: {conversation_id}")
    
    # 1. Fetch Real Data
    try:
        data = await fetch_conversation_from_elevenlabs(conversation_id)
    except Exception as e:
        logger.error(f"ElevenLabs API fail: {e}")
        return {"status": "error", "error": str(e)}

    # 2. Extract Specific Fields
    # Expects 5 values: data_collection, intent, phone, summary, name
    data_collection, intent, phone, summary, name = extract_conversation_data(data)
    
    logger.info(f"📊 DATA EXTRACTED: Name='{name}', Phone='{phone}'")

    # 3. Link to Session
    session = db_session.query(models.VoiceSession).filter(
        (models.VoiceSession.conversation_id == conversation_id) | 
        (models.VoiceSession.id == conversation_id)
    ).first()
    
    if not session:
        logger.warning(f"⚠️ Session not found for {conversation_id}, treating as external call")
        # Fallback to demo tenant if session missing
        tenant_id = "demo-tenant" 
    else:
        tenant_id = session.tenant_id
        # Update Session Metadata
        session.summary = summary
        session.extracted_intent = intent
        session.status = models.VoiceSessionStatus.COMPLETED
        if phone:
            session.customer_phone = phone

    # 4. RESOLVE REAL CUSTOMER (Ali)
    effective_phone = phone or "0000000000"
    if session and session.customer_phone:
        effective_phone = session.customer_phone
        
    effective_name = name or "Voice User"

    customer = get_or_create_customer(
        db_session=db_session,
        customer_phone=effective_phone,
        customer_name=effective_name,
        tenant_id=tenant_id
    )
    
    if session:
        session.customer_id = customer.id
    
    db_session.flush()

    # 5. CREATE ARTIFACTS
    logger.info(f"🚀 Creating Artifacts for {customer.name} ({customer.id})")
    
    # Create fake session object if real one missing to pass tenant_id
    if not session:
        class MockSession:
            id = conversation_id
            tenant_id = tenant_id
            customer_id = customer.id
            customer_phone = effective_phone
            summary = summary
            created_at = None
            ended_at = None
            conversation_id = conversation_id
            agent_name = "External"
        session = MockSession()

    create_ticket_from_conversation(db_session, session, data_collection)
    create_booking_from_conversation(db_session, session, data_collection)
    create_history_records(db_session, session)
    
    db_session.commit()
    return {"status": "success", "customer": customer.name, "message": "All records created"}