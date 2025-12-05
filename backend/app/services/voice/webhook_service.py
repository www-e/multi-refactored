"""
Webhook service for handling ElevenLabs webhook requests
Processes conversation results and creates appropriate records
"""
import logging
from typing import Dict, Any, Optional
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
    Process an ElevenLabs conversation webhook
    Fetches conversation data and creates appropriate records
    """
    # Fetch conversation data from ElevenLabs
    data = fetch_conversation_from_elevenlabs(conversation_id)
    
    # Extract data from conversation
    data_collection, intent, customer_phone, call_summary, customer_name = extract_conversation_data(data)
    
    # Find voice session by conversation ID or session ID
    voice_session = (
        db_session.query(models.VoiceSession)
        .filter(
            (models.VoiceSession.conversation_id == conversation_id) |
            (models.VoiceSession.id == conversation_id)
        )
        .first()
    )
    
    if not voice_session:
        logger.warning(f"Webhook received for non-existent conversation_id: {conversation_id}. This may be an attempt to create unauthorized records.")
        db_session.commit()  # Commit any previous changes but don't create new entities
        return {
            "status": "warning",
            "conversation_id": conversation_id,
            "processed": {"message": f"Conversation {conversation_id} not found in database"}
        }
    
    logger.info(f"Found voice session {voice_session.id} for conversation {conversation_id}")
    
    # Update voice session with conversation data
    voice_session.summary = call_summary
    voice_session.extracted_intent = intent
    voice_session.customer_phone = customer_phone
    voice_session.status = models.VoiceSessionStatus.COMPLETED
    
    # Update the customer record with extracted information
    if customer_name or customer_phone:
        customer = db_session.query(models.Customer).filter(
            models.Customer.id == voice_session.customer_id
        ).first()
        if customer:
            logger.info(f"Updating customer {customer.id} with name: {customer_name}, phone: {customer_phone}")
            if customer_name:
                customer.name = customer_name
            if customer_phone:
                customer.phone = customer_phone
    
    # Update ended_at time for proper duration calculation
    voice_session.ended_at = datetime.now(timezone.utc)
    
    # Flush to ensure the updates are saved before creating related records
    db_session.flush()
    
    # Process intent and create appropriate records
    action_taken = False
    action_type = "none"
    
    if intent == "book_appointment":
        logger.info(f"Creating booking for conversation {conversation_id}")
        action_taken = create_booking_from_conversation(db_session, voice_session, data_collection)
        action_type = "booking"
    elif intent == "raise_ticket":
        logger.info(f"Creating ticket for conversation {conversation_id}")
        action_taken = create_ticket_from_conversation(db_session, voice_session, data_collection)
        action_type = "ticket"
    else:
        logger.warning(f"Unhandled intent '{intent}' for conversation {conversation_id}. No action taken.")

    # Always create corresponding Conversation and Call records for voice sessions
    # This ensures they show up in the calls and conversations pages
    logger.info(f"Creating conversation and call records for voice session {voice_session.id}")
    conv_success = create_conversation_from_voice_session(db_session, voice_session, call_summary)
    call_success = create_call_from_voice_session(db_session, voice_session, call_summary)

    # Log if these operations fail, but continue processing
    if not conv_success:
        logger.warning(f"Failed to create conversation record for voice session {voice_session.id}")
    if not call_success:
        logger.warning(f"Failed to create call record for voice session {voice_session.id}")

    # Commit all changes
    db_session.commit()
    
    return {
        "status": "success",
        "conversation_id": conversation_id,
        "processed": {
            "intent": intent,
            "action_type": action_type,
            "action_taken": action_taken
        }
    }


def process_webhook_payload(
    db_session: Session,
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Process webhook payload and return result
    """
    # Extract conversation ID from payload
    conversation_id = extract_conversation_id_from_payload(payload)
    
    if not conversation_id:
        logger.error(f"Webhook payload missing conversation_id. Payload keys: {list(payload.keys())}")
        raise HTTPException(status_code=400, detail="Missing conversation_id in payload")
    
    logger.info(f"Processing conversation: {conversation_id}")
    
    return process_conversation_webhook(db_session, conversation_id)