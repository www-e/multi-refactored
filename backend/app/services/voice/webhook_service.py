"""
Webhook service for handling ElevenLabs webhook requests.
Processes conversation results, synchronizes customer data, and creates actionable records.
"""
import logging
from typing import Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs, 
    extract_conversation_data, 
    extract_conversation_id_from_payload
)
from .action_service import (
    create_booking_from_conversation,
    create_ticket_from_conversation,
    create_call_from_voice_session,
    create_conversation_from_voice_session
)

logger = logging.getLogger(__name__)

def process_conversation_webhook(
    db_session: Session,
    conversation_id: str
) -> Dict[str, Any]:
    """
    Process an ElevenLabs conversation webhook with 100% data consistency.
    """
    # 1. Fetch Master Data from ElevenLabs API
    try:
        data = fetch_conversation_from_elevenlabs(conversation_id)
    except Exception as e:
        logger.error(f"Failed to fetch conversation {conversation_id} from ElevenLabs: {e}")
        # If we can't get data from source, we cannot process safely.
        return {"status": "error", "error": str(e)}

    # 2. Extract Data Points using the service helper
    # Returns: data_collection dict, intent string, phone string, summary string, name string
    data_collection, intent, customer_phone, call_summary, customer_name = extract_conversation_data(data)
    
    # SMART EXTRACTION: Attempt to find Region/Project/Neighborhood from various AI label possibilities
    # This fixes the blank "المنطقة" column issue.
    extracted_region = (
        data_collection.get("project", {}).get("value") or 
        data_collection.get("neighborhood", {}).get("value") or 
        data_collection.get("area", {}).get("value") or 
        data_collection.get("location", {}).get("value")
    )

    # 3. Locate the Voice Session
    # Check both conversation_id (primary) and id (fallback)
    voice_session = db_session.query(models.VoiceSession).filter(
        (models.VoiceSession.conversation_id == conversation_id) |
        (models.VoiceSession.id == conversation_id)
    ).first()

    if not voice_session:
        logger.warning(f"Orphaned Webhook: No session found for conversation_id: {conversation_id}")
        return {"status": "ignored", "reason": "session_not_found"}

    logger.info(f"Processing Session: {voice_session.id} | Intent: {intent}")

    # 4. Update Session Metadata (Closes the loop on 'Ghost Calls')
    voice_session.summary = call_summary
    voice_session.extracted_intent = intent
    voice_session.customer_phone = customer_phone

    # 5. SYNCHRONIZE CUSTOMER DATA (The "Identity" Fix)
    # We update the customer profile BEFORE creating bookings/tickets
    customer = db_session.query(models.Customer).filter(
        models.Customer.id == voice_session.customer_id
    ).first()

    updates = []
    if customer:
        # Update Name if we have a real name (ignore generic placeholders)
        if customer_name and customer_name.strip().lower() not in ['unknown', 'user', 'n/a', 'customer', 'unknown customer', '']:
            # Additional check for "customer" patterns like "Customer Unknown" or temporary names
            customer_name_lower = customer_name.strip().lower()
            # Check for common temporary name patterns to avoid overwriting legitimate names
            is_temporary_name = (
                customer_name_lower in ['customer unknown', 'unknown customer'] or
                customer_name_lower.startswith('customer ') or
                customer_name_lower.startswith('temp customer') or
                'unknown' in customer_name_lower
            )

            if not is_temporary_name:
                customer.name = customer_name.strip()
                updates.append("name")

        # Update Phone if extracted and different from current phone
        if customer_phone and customer.phone != customer_phone:
            customer.phone = customer_phone
            updates.append("phone")

        # Update Region/Neighborhood (The Fix for 'المنطقة')
        if extracted_region:
            # Neighborhoods is a JSON field in DB, treat as a list
            current_neighborhoods = customer.neighborhoods
            if not isinstance(current_neighborhoods, list):
                current_neighborhoods = []

            # Add if unique
            if extracted_region not in current_neighborhoods:
                current_neighborhoods.append(extracted_region)
                customer.neighborhoods = current_neighborhoods
                updates.append("region")

        if updates:
            logger.info(f"Customer {customer.id} Updated fields: {', '.join(updates)}")

    # Force save customer updates NOW so subsequent records reference correct data
    db_session.flush()

    # 6. EXECUTE ACTIONS (Create Booking/Ticket based on Intent)
    action_taken = False
    action_type = "none"

    if intent == "book_appointment":
        # Pass the updated session and data to create booking
        action_taken = create_booking_from_conversation(db_session, voice_session, data_collection)
        action_type = "booking"
    elif intent == "raise_ticket":
        # Pass the updated session and data to create ticket
        action_taken = create_ticket_from_conversation(db_session, voice_session, data_collection)
        action_type = "ticket"
    else:
        # Fallback: If AI missed the intent label but collected a date, assume booking
        if data_collection.get("preferred_datetime", {}).get("value"):
             logger.info("Fallback: Creating booking based on datetime presence despite missing intent")
             action_taken = create_booking_from_conversation(db_session, voice_session, data_collection)
             action_type = "booking_fallback"

    # 7. Create Historical Records (Populates 'Calls' and 'Conversations' pages)
    # This ensures the call appears in the "Recent Calls' table
    logger.info("Creating conversation and call history records")
    create_conversation_from_voice_session(db_session, voice_session, call_summary)
    create_call_from_voice_session(db_session, voice_session, call_summary)

    # 8. Update voice session status to completed (ensures proper call status) - do this last
    voice_session.status = models.VoiceSessionStatus.COMPLETED
    if not voice_session.ended_at:
        voice_session.ended_at = datetime.now(timezone.utc)

    # 9. Final Commit
    db_session.commit()

    return {
        "status": "success",
        "conversation_id": conversation_id,
        "processed": {
            "intent": intent,
            "action_type": action_type,
            "action_taken": action_taken,
            "customer_updated": len(updates) > 0
        }
    }

def process_webhook_payload(
    db_session: Session,
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Entry point for webhook payload processing.
    """
    # Extract the ID from the payload structure
    conversation_id = extract_conversation_id_from_payload(payload)
    if not conversation_id:
        logger.error(f"Webhook payload missing conversation_id. Payload keys: {list(payload.keys())}")
        raise HTTPException(status_code=400, detail="Missing conversation_id in payload")
    
    logger.info(f"Received webhook for conversation: {conversation_id}")
    return process_conversation_webhook(db_session, conversation_id)