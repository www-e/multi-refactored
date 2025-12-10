import logging
import os  # <--- Added import
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any
from types import SimpleNamespace
from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    extract_conversation_data,
    extract_conversation_id_from_payload
)
from .customer_service import upsert_customer
from .action_service import create_full_interaction_record

logger = logging.getLogger(__name__)

# Load default tenant from environment, fallback to demo-tenant if missing
DEFAULT_TENANT_ID = os.getenv("TENANT_ID", "demo-tenant")

async def process_webhook_payload(db: Session, payload: Dict[str, Any]) -> Dict[str, str]:
    conv_id = extract_conversation_id_from_payload(payload)
    if not conv_id:
        logger.error("❌ Webhook ignored: No conversation_id found.")
        return {"status": "error", "message": "Missing conversation_id"}

    logger.info(f"🤖 Processing Webhook for ElevenLabs ID: {conv_id}")

    # 1. Fetch ElevenLabs Data
    try:
        data = await fetch_conversation_from_elevenlabs(conv_id)
    except Exception as e:
        logger.error(f"❌ ElevenLabs API Fetch Failed: {e}")
        return {"status": "error", "message": str(e)}

    data_dict, intent, phone, summary, name, client_ref_id = extract_conversation_data(data)
    logger.info(f"🔍 Extracted: Intent='{intent}', Phone='{phone}', RefID='{client_ref_id}'")

    # 2. Session Discovery
    session = None
    if client_ref_id:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.id == client_ref_id).first()
        if session:
            logger.info(f"✅ Linked via Client Ref ID: {session.id}")
    
    if not session:
        session = db.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conv_id).first()
        if session:
            logger.info(f"✅ Linked via Conversation ID: {session.id}")

    # 3. Context Recovery (Tenant ID & Customer)
    # CRITICAL: Use the Env Variable default, not hardcoded string
    current_tenant_id = DEFAULT_TENANT_ID
    
    if session:
        current_tenant_id = session.tenant_id
        # Update session with final data
        session.conversation_id = conv_id
        session.summary = summary
        session.extracted_intent = intent
        session.status = models.VoiceSessionStatus.COMPLETED
        session.ended_at = datetime.now(timezone.utc)
        if phone: session.customer_phone = phone
        
        # Link Customer to Session if not already linked
        customer = upsert_customer(db, phone, name, current_tenant_id)
        if not session.customer_id:
            session.customer_id = customer.id
            
    else:
        # Ghost Session Handling
        logger.warning(f"👻 Session not found for {conv_id}. Initiating Context Recovery...")
        
        # Try to find existing customer by phone to recover Tenant ID
        existing_customer = None
        if phone:
            existing_customer = db.query(models.Customer).filter(
                models.Customer.phone == phone
            ).order_by(models.Customer.created_at.desc()).first()
            
        if existing_customer:
            current_tenant_id = existing_customer.tenant_id
            logger.info(f"🧬 Context Recovered: Found existing customer {existing_customer.name}, using Tenant: {current_tenant_id}")
            customer = existing_customer
            # Update name if new one is better
            if name and name != "Unknown" and name != customer.name:
                customer.name = name
                db.add(customer)
        else:
            # Create new customer in the Default Tenant (from .env)
            logger.info(f"⚠️ No context found. Creating new customer in {current_tenant_id}")
            customer = upsert_customer(db, phone, name, current_tenant_id)

        # Create virtual session object for the logic
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

    # 4. Action Execution
    try:
        create_full_interaction_record(db, session, customer, data_dict)
        
        # Determine if we are committing a real SQLAlchemy object or just the side-effects
        if hasattr(session, "_sa_instance_state"):
            db.add(session)
            
        db.commit()
        logger.info(f"🚀 SUCCESS: Webhook processed for {customer.name} (Tenant: {current_tenant_id})")
        return {
            "status": "success",
            "customer": customer.name,
            "tenant_id": current_tenant_id,
            "action": intent,
            "session_found": hasattr(session, "_sa_instance_state")
        }
    except Exception as e:
        db.rollback()
        logger.error(f"💥 Critical Failure in Action Service: {e}", exc_info=True)
        return {"status": "error", "message": "Action logic failed"}