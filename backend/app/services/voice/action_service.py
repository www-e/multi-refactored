"""
Action service for voice operations.
Handles creation of bookings, tickets, calls, and conversations from voice session data
with robust error handling and data consistency checks.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

def create_booking_from_conversation(
    db_session: Session, 
    voice_session: models.VoiceSession, 
    data_collection: Dict
) -> bool:
    """
    Creates a Booking record from conversation data.
    Includes safety nets for invalid dates to prevent data loss.
    """
    try:
        # 1. Prevent Duplicates
        existing_booking = db_session.query(models.Booking).filter(
            models.Booking.session_id == voice_session.id
        ).first()
        if existing_booking:
            logger.info(f"Booking already exists for session {voice_session.id}")
            return False 

        # 2. Extract Data
        raw_date = data_collection.get("preferred_datetime", {}).get("value", "")
        # Fallback to "General Inquiry" if project not specified
        project_code = (
            data_collection.get("project", {}).get("value") or 
            data_collection.get("property", {}).get("value") or 
            "GENERAL-INQUIRY"
        )
        
        # 3. Robust Date Parsing
        # Default to tomorrow same time if parsing fails
        appointment_dt = datetime.now(timezone.utc) + timedelta(days=1)
        
        if raw_date:
            try:
                # Handle ISO format from ElevenLabs (e.g., 2025-12-11T06:00:00+03:00)
                # Replace Z with +00:00 for Python 3.10 compatibility if needed
                clean_date = raw_date.replace('Z', '+00:00')
                appointment_dt = datetime.fromisoformat(clean_date)
            except ValueError:
                logger.warning(f"Date parsing failed for '{raw_date}', using default (tomorrow).")
            except Exception as e:
                logger.warning(f"Unexpected date error: {e}, using default.")

        # 4. Fetch latest customer info (they were just updated in webhook_service)
        customer = db_session.query(models.Customer).filter(
            models.Customer.id == voice_session.customer_id
        ).first()

        # Use actual customer data or empty strings (no placeholders)
        customer_name = ""
        if customer and customer.name and customer.name.strip():
            customer_name = customer.name
        
        customer_phone = ""
        if voice_session.customer_phone and voice_session.customer_phone.strip():
            customer_phone = voice_session.customer_phone
        elif customer and customer.phone and customer.phone.strip():
            customer_phone = customer.phone

        # 5. Create Booking Record
        booking = models.Booking(
            id=generate_id("bk"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id,
            customer_name=customer_name,
            phone=customer_phone,
            property_code=project_code,
            project=project_code,
            start_date=appointment_dt,
            preferred_datetime=appointment_dt,
            source=models.ChannelEnum.voice,
            created_by=models.AIOrHumanEnum.AI,
            status=models.BookingStatusEnum.pending,
            price_sar=0.0, # Default price
            created_at=datetime.now(timezone.utc)
        )

        db_session.add(booking)
        db_session.flush()
        return True

    except Exception as e:
        logger.error(f"CRITICAL: Booking creation failed for session {voice_session.id}: {e}", exc_info=True)
        return False

def create_ticket_from_conversation(
    db_session: Session, 
    voice_session: models.VoiceSession, 
    data_collection: Dict
) -> bool:
    """
    Creates a Ticket record from conversation data.
    """
    try:
        # 1. Prevent Duplicates
        if db_session.query(models.Ticket).filter(models.Ticket.session_id == voice_session.id).first():
            return False

        # 2. Extract Data
        issue_text = voice_session.summary or "No summary provided by AI"
        category = data_collection.get("category", {}).get("value", "General")
        project = data_collection.get("project", {}).get("value", "N/A")
        
        # 3. Fetch latest customer info
        customer = db_session.query(models.Customer).filter(
            models.Customer.id == voice_session.customer_id
        ).first()

        # Use actual customer data or empty strings (no placeholders)
        customer_name = ""
        if customer and customer.name and customer.name.strip():
            customer_name = customer.name
        
        customer_phone = ""
        if voice_session.customer_phone and voice_session.customer_phone.strip():
            customer_phone = voice_session.customer_phone
        elif customer and customer.phone and customer.phone.strip():
            customer_phone = customer.phone

        # 4. Create Ticket Record
        ticket = models.Ticket(
            id=generate_id("tkt"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id,
            customer_name=customer_name,
            phone=customer_phone,
            issue=issue_text,
            project=project,
            category=category,
            priority=models.TicketPriorityEnum.med,
            status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )

        db_session.add(ticket)
        db_session.flush()
        return True

    except Exception as e:
        logger.error(f"CRITICAL: Ticket creation failed for session {voice_session.id}: {e}", exc_info=True)
        return False

def create_call_from_voice_session(
    db_session: Session,
    voice_session: models.VoiceSession,
    call_summary: Optional[str] = None
) -> bool:
    """
    Creates a historical Call record.
    Required for the 'Calls' page table.
    """
    try:
        # Prevent duplicate call creation for the same voice session
        existing_call = db_session.query(models.Call).filter(
            models.Call.conversation_id == voice_session.conversation_id
        ).first()

        if existing_call:
            logger.info(f"Call history already exists for conversation {voice_session.conversation_id}")
            return False

        # Only create call if conversation_id exists
        if not voice_session.conversation_id:
            return False

        # Calculate duration
        duration = 0
        if voice_session.created_at and voice_session.ended_at:
            duration = int((voice_session.ended_at - voice_session.created_at).total_seconds())

        # Set call status based on voice session status
        call_status = models.CallStatusEnum.connected
        if voice_session.status == models.VoiceSessionStatus.COMPLETED:
            call_status = models.CallStatusEnum.connected
        elif voice_session.status == models.VoiceSessionStatus.FAILED:
            call_status = models.CallStatusEnum.no_answer  # or another appropriate status

        # Set call outcome based on extracted intent
        call_outcome = models.CallOutcomeEnum.info  # Default outcome
        if voice_session.extracted_intent == "book_appointment":
            call_outcome = models.CallOutcomeEnum.booked
        elif voice_session.extracted_intent == "raise_ticket":
            call_outcome = models.CallOutcomeEnum.ticket

        # Create Call Record
        call = models.Call(
            id=generate_id("call"),
            tenant_id=voice_session.tenant_id,
            conversation_id=voice_session.conversation_id,
            direction=models.CallDirectionEnum.inbound, # Inbound from ElevenLabs
            status=call_status,
            handle_sec=duration,
            outcome=call_outcome,
            ai_or_human=models.AIOrHumanEnum.AI,
            recording_url=None # ElevenLabs recording URL usually retrieved separately if needed
        )

        db_session.add(call)
        db_session.flush()
        return True
    except Exception as e:
        logger.error(f"Call history creation failed: {e}")
        return False

def create_conversation_from_voice_session(
    db_session: Session,
    voice_session: models.VoiceSession,
    call_summary: Optional[str] = None
) -> bool:
    """
    Creates a historical Conversation record.
    Required for the 'Conversations' page.
    """
    try:
        # Prevent duplicate conversation creation for the same voice session
        existing_conversation = db_session.query(models.Conversation).filter(
            models.Conversation.recording_url == voice_session.conversation_id  # Use conversation_id as recording_url
        ).first()

        if existing_conversation:
            logger.info(f"Conversation already exists for voice session {voice_session.id}")
            return False

        # Create Conversation Record
        conversation = models.Conversation(
            id=generate_id("conv"),
            tenant_id=voice_session.tenant_id,
            channel=models.ChannelEnum.voice,
            customer_id=voice_session.customer_id,
            summary=call_summary or voice_session.summary or "Voice Conversation",
            sentiment="neutral",
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=voice_session.created_at,
            ended_at=voice_session.ended_at,
            recording_url=voice_session.conversation_id
        )

        db_session.add(conversation)
        db_session.flush()

        # Only update conversation_id if not already set, to avoid overwriting the original
        if not voice_session.conversation_id:
            voice_session.conversation_id = conversation.id

        return True
    except Exception as e:
        logger.error(f"Conversation history creation failed: {e}")
        return False