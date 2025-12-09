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

async def process_conversation_webhook(
    db_session: Session,
    conversation_id: str
) -> Dict[str, Any]:
    """
    Process an ElevenLabs conversation webhook with 100% data consistency.
    """
    logger.info(f"🔔 WEBHOOK PROCESSING STARTED for conversation: {conversation_id}")
    
    # 1. Fetch Master Data from ElevenLabs API
    try:
        logger.info(f"📡 Fetching conversation data from ElevenLabs API...")
        data = await fetch_conversation_from_elevenlabs(conversation_id)
        logger.info(f"✅ Successfully fetched conversation data")
    except Exception as e:
        logger.error(f"❌ Failed to fetch conversation {conversation_id} from ElevenLabs: {e}")
        # If we can't get data from source, we cannot process safely.
        return {"status": "error", "error": str(e)}

    # 2. Extract Data Points using the service helper
    # Returns: data_collection dict, intent string, phone string, summary string, name string
    data_collection, intent, customer_phone, call_summary, customer_name = extract_conversation_data(data)
    
    logger.info(f"📊 EXTRACTED DATA:")
    logger.info(f"   - Customer Name: {customer_name or '(none)'}")
    logger.info(f"   - Customer Phone: {customer_phone or '(none)'}")
    logger.info(f"   - Intent: {intent}")
    logger.info(f"   - Summary: {call_summary[:100] if call_summary else '(none)'}...")
    
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
        logger.warning(f"⚠️ Orphaned Webhook: No session found for conversation_id: {conversation_id}")
        return {"status": "ignored", "reason": "session_not_found"}

    logger.info(f"✅ Found voice session: {voice_session.id} | Status: {voice_session.status}")

    # 4. Update Session Metadata (Closes the loop on 'Ghost Calls')
    voice_session.summary = call_summary
    voice_session.extracted_intent = intent
    voice_session.customer_phone = customer_phone

    # 5. SYNCHRONIZE CUSTOMER DATA (The "Identity" Fix)
    # Create or update the customer profile with extracted data
    from .customer_service import get_or_create_customer
    
    # Try to get existing customer by ID
    customer = db_session.query(models.Customer).filter(
        models.Customer.id == voice_session.customer_id
    ).first()
    
    # If customer doesn't exist (we didn't create it initially), create it now with real data
    if not customer:
        logger.info(f"Creating new customer with extracted data: name={customer_name}, phone={customer_phone}")
        customer = get_or_create_customer(
            db_session=db_session,
            customer_id=voice_session.customer_id,  # Use the temp ID we generated
            customer_phone=customer_phone,
            customer_name=customer_name,
            tenant_id=voice_session.tenant_id
        )
    
    # Update customer with extracted data
    updates = []
    if customer:
        # Update Name if we have a real name
        # Only skip if the name is clearly a placeholder or empty
        if customer_name and customer_name.strip():
            customer_name_clean = customer_name.strip()
            # Skip only if it's an obvious placeholder (case-insensitive English check)
            customer_name_lower = customer_name_clean.lower()
            is_placeholder = (
                customer_name_lower in ['unknown', 'user', 'n/a', 'customer', 'unknown customer', 'temp'] or
                customer_name_lower.startswith('customer ') or
                customer_name_lower.startswith('temp ')
            )
            
            # Update if: (1) current name is empty/placeholder AND new name is not placeholder
            # OR (2) new name is different and not a placeholder
            should_update = (
                (not customer.name or customer.name.strip() == '' or customer.name == 'Unknown Customer') and not is_placeholder
            ) or (
                customer.name != customer_name_clean and not is_placeholder
            )
            
            if should_update:
                customer.name = customer_name_clean
                updates.append("name")
                logger.info(f"✅ Updated customer name to '{customer_name_clean}'")

        # Update Phone if extracted and different from current phone
        if customer_phone and customer_phone.strip():
            customer_phone_clean = customer_phone.strip()
            # Update if current phone is empty or different
            if not customer.phone or customer.phone.strip() == '' or customer.phone != customer_phone_clean:
                customer.phone = customer_phone_clean
                updates.append("phone")
                logger.info(f"✅ Updated customer phone to '{customer_phone_clean}'")

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

    logger.info(f"🎯 Processing intent: {intent}")
    
    if intent == "book_appointment":
        # Pass the updated session and data to create booking
        logger.info("📅 Creating booking from conversation...")
        action_taken = create_booking_from_conversation(db_session, voice_session, data_collection)
        action_type = "booking"
        if action_taken:
            logger.info("✅ Booking created successfully")
        else:
            logger.warning("⚠️ Booking creation failed or skipped (duplicate?)")
    elif intent == "raise_ticket":
        # Pass the updated session and data to create ticket
        logger.info("🎫 Creating ticket from conversation...")
        action_taken = create_ticket_from_conversation(db_session, voice_session, data_collection)
        action_type = "ticket"
        if action_taken:
            logger.info("✅ Ticket created successfully")
        else:
            logger.warning("⚠️ Ticket creation failed or skipped (duplicate?)")
    else:
        # Fallback: If AI missed the intent label but collected a date, assume booking
        if data_collection.get("preferred_datetime", {}).get("value"):
             logger.info("💡 Fallback: Creating booking based on datetime presence despite missing intent")
             action_taken = create_booking_from_conversation(db_session, voice_session, data_collection)
             action_type = "booking_fallback"

    # 7. Create Historical Records (Populates 'Calls' and 'Conversations' pages)
    # This ensures the call appears in the "Recent Calls' table
    logger.info("📝 Creating conversation and call history records...")
    conv_created = create_conversation_from_voice_session(db_session, voice_session, call_summary)
    call_created = create_call_from_voice_session(db_session, voice_session, call_summary)
    logger.info(f"✅ History records created: conversation={conv_created}, call={call_created}")

    # 8. Update voice session status to completed (ensures proper call status) - do this last
    voice_session.status = models.VoiceSessionStatus.COMPLETED
    if not voice_session.ended_at:
        voice_session.ended_at = datetime.now(timezone.utc)

    # 9. Final Commit
    db_session.commit()
    
    logger.info(f"🎉 WEBHOOK PROCESSING COMPLETED SUCCESSFULLY")
    logger.info(f"   - Action: {action_type}")
    logger.info(f"   - Customer: {customer.name if customer else 'N/A'}")
    logger.info(f"   - Phone: {customer.phone if customer else 'N/A'}")

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

async def process_webhook_payload(
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
    return await process_conversation_webhook(db_session, conversation_id)