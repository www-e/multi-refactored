import logging
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any

from app import models
from .webhook_handlers import (
    WebhookValidationHandler,
    WebhookDataFetchHandler,
    WebhookSessionHandler,
    WebhookCustomerHandler,
    WebhookRecordingHandler,
    WebhookActionHandler
)

logger = logging.getLogger(__name__)

# Load default tenant from environment, fallback to demo-tenant if missing
DEFAULT_TENANT_ID = os.getenv("TENANT_ID", "demo-tenant")

async def process_webhook_payload(db: Session, payload: Dict[str, Any]) -> Dict[str, str]:
    conv_id = WebhookValidationHandler.validate_payload(payload)
    if not conv_id:
        return {"status": "error", "message": "Missing conversation_id"}
    if WebhookValidationHandler.check_duplicate(db, conv_id):
        return {
            "status": "success",
            "message": "Webhook already processed",
            "conversation_id": conv_id
        }

    data_result = await WebhookDataFetchHandler.fetch_and_parse_data(conv_id)
    if data_result is None:
        return {"status": "error", "message": "Failed to fetch data from ElevenLabs"}

    data_dict, intent, phone, summary, name, client_ref_id, recording_url, transcript_data, original_data = data_result
    transcript_count = len(transcript_data) if transcript_data else 0

    session = WebhookSessionHandler.discover_session(db, client_ref_id, conv_id)
    customer, current_tenant_id, session = WebhookCustomerHandler.get_or_create_customer(
        db, session, phone, name, summary, intent, client_ref_id, conv_id, original_data
    )

    # CRITICAL FIX: Order of operations swapped
    # 1. First, create the DB records (Conversation, Call, etc.)
    success = WebhookActionHandler.execute_business_logic(db, session, customer, data_dict, conv_id)

    # 2. THEN update the recording URL on the now-existing records
    if success:
        WebhookRecordingHandler.update_recording_urls(db, session, recording_url, transcript_count)
        # 3. Explicit commit to ensure the URL update is saved
        try:
            db.commit()
        except Exception as e:
            logger.error(f"Failed to commit recording URL update: {e}")

    if success:
        return {
            "status": "success",
            "customer": customer.name,
            "tenant_id": current_tenant_id,
            "action": intent,
            "session_found": hasattr(session, "_sa_instance_state")
        }
    else:
        return {"status": "error", "message": "Action logic failed"}