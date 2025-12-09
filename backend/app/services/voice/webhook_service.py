import logging
from sqlalchemy.orm import Session
from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    extract_conversation_data,
    extract_conversation_id_from_payload
)
from .customer_service import upsert_customer
from .action_service import create_full_interaction_record

logger = logging.getLogger(__name__)

async def process_webhook_payload(db: Session, payload: dict):
    # 1. Get ID
    conv_id = extract_conversation_id_from_payload(payload)
    if not conv_id:
        return {"status": "error", "msg": "No ID in payload"}

    logger.info(f"🤖 Processing Webhook for ID: {conv_id}")

    # 2. Fetch Analysis
    try:
        data = await fetch_conversation_from_elevenlabs(conv_id)
    except Exception as e:
        logger.error(f"ElevenLabs Fetch Error: {e}")
        return {"status": "error", "msg": str(e)}

    # 3. Extract Data (Tuple: data_dict, intent, phone, summary, name)
    data_dict, intent, phone, summary, name = extract_conversation_data(data)
    
    # 4. Find Session
    session = db.query(models.VoiceSession).filter(
        (models.VoiceSession.conversation_id == conv_id) | 
        (models.VoiceSession.id == conv_id)
    ).first()

    tenant = session.tenant_id if session else "demo-tenant"

    # 5. Upsert Customer
    customer = upsert_customer(db, phone, name, tenant)

    # 6. Update Session
    if session:
        session.customer_id = customer.id
        session.customer_phone = customer.phone
        session.summary = summary
        session.extracted_intent = intent
        session.status = models.VoiceSessionStatus.COMPLETED
    else:
        # Create a mock session object if we couldn't find the real one
        # to ensure action_service has something to read from
        class MockSession:
            id = conv_id
            tenant_id = tenant
            conversation_id = conv_id
            summary = summary
            created_at = None
        session = MockSession()

    # 7. Create Everything
    create_full_interaction_record(db, session, customer, data_dict)

    db.commit()
    return {"status": "success", "customer": customer.name}