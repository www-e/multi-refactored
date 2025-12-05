"""
Action service for voice operations
Handles creation of bookings, tickets, calls, and conversations from voice session data
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app import models
from .customer_service import get_or_create_customer

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
    Helper to create a booking from conversation data.
    """
    customer_phone = voice_session.customer_phone
    preferred_datetime_str = data_collection.get("preferred_datetime", {}).get("value", "")
    if not (preferred_datetime_str and customer_phone):
        return False

    # Check if booking already exists for this session
    existing_booking = db_session.query(models.Booking).filter(
        models.Booking.session_id == voice_session.id
    ).first()
    if existing_booking:
        return False  # Already created

    try:
        appointment_dt = datetime.fromisoformat(preferred_datetime_str.replace('Z', '+00:00'))
        customer_name = data_collection.get("customer_name", {}).get("value", "")
        project = data_collection.get("project", {}).get("value", "")

        customer = get_or_create_customer(
            db_session, 
            customer_phone=customer_phone, 
            customer_name=customer_name, 
            tenant_id=voice_session.tenant_id
        )

        booking = models.Booking(
            id=generate_id("bk"), 
            tenant_id=voice_session.tenant_id, 
            customer_id=customer.id,
            session_id=voice_session.id, 
            customer_name=customer.name, 
            phone=customer_phone,
            property_code=project or "PROP-DEFAULT", 
            start_date=appointment_dt,
            source=models.ChannelEnum.voice, 
            created_by=models.AIOrHumanEnum.AI,
            project=project or "Voice Booking", 
            preferred_datetime=appointment_dt,
            status=models.BookingStatusEnum.pending, 
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(booking)
        db_session.flush()  # Don't commit here, let caller do it
        return True
    except Exception as e:
        logger.error(f"Could not create booking from ElevenLabs data for session {voice_session.id}: {e}")
        return False


def create_ticket_from_conversation(
    db_session: Session, 
    voice_session: models.VoiceSession, 
    data_collection: Dict
) -> bool:
    """
    Helper to create a ticket from conversation data.
    """
    customer_phone = voice_session.customer_phone
    if not customer_phone:
        return False

    # Check if ticket already exists for this session
    existing_ticket = db_session.query(models.Ticket).filter(
        models.Ticket.session_id == voice_session.id
    ).first()
    if existing_ticket:
        return False  # Already created

    try:
        customer_name = data_collection.get("customer_name", {}).get("value", "")
        project = data_collection.get("project", {}).get("value", "")

        customer = get_or_create_customer(
            db_session, 
            customer_phone=customer_phone, 
            customer_name=customer_name, 
            tenant_id=voice_session.tenant_id
        )

        ticket = models.Ticket(
            id=generate_id("tkt"), 
            tenant_id=voice_session.tenant_id, 
            customer_id=customer.id,
            session_id=voice_session.id, 
            customer_name=customer.name, 
            phone=customer_phone,
            issue=voice_session.summary or "No summary provided", 
            project=project or "N/A",
            category=data_collection.get("category", {}).get("value", "General"),
            priority=models.TicketPriorityEnum.med, 
            status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(ticket)
        db_session.flush()  # Don't commit here, let caller do it
        return True
    except Exception as e:
        logger.error(f"Could not create ticket from ElevenLabs data for session {voice_session.id}: {e}")
        return False


def create_call_from_voice_session(
    db_session: Session, 
    voice_session: models.VoiceSession, 
    call_summary: Optional[str] = None
) -> bool:
    """
    Helper to create a call record from voice session data.
    """
    try:
        # Only create call if there's a conversation_id (set by create_conversation_from_voice_session)
        if not voice_session.conversation_id:
            logger.warning(f"Cannot create call for voice session {voice_session.id} - no conversation_id set")
            return False

        # Determine direction based on voice session direction, default to inbound if not specified
        direction = models.CallDirectionEnum.inbound
        if voice_session.direction:
            if voice_session.direction.lower() == "outbound":
                direction = models.CallDirectionEnum.outbound
            elif voice_session.direction.lower() == "inbound":
                direction = models.CallDirectionEnum.inbound

        # Calculate call duration in seconds based on voice session start and end times
        handle_sec = None
        if voice_session.created_at and voice_session.ended_at:
            duration = (voice_session.ended_at - voice_session.created_at).total_seconds()
            handle_sec = int(duration)
        elif voice_session.created_at:
            # If only created_at is available, calculate from creation to now (for ongoing calls)
            duration = (datetime.now(timezone.utc) - voice_session.created_at).total_seconds()
            handle_sec = int(duration)

        # Create call record (Call model doesn't have customer_id, only conversation_id)
        call = models.Call(
            id=generate_id("call"),
            tenant_id=voice_session.tenant_id,  # Include tenant_id for proper isolation
            conversation_id=voice_session.conversation_id,
            direction=direction,
            status=models.CallStatusEnum.connected,   # Use valid CallStatusEnum value
            handle_sec=handle_sec,      # Duration in seconds from voice session times
            outcome=None,         # Not available from voice session
            ai_or_human=models.AIOrHumanEnum.AI,  # From voice AI agent
            recording_url=None,   # Will be populated later if recording exists
            retention_expires_at=None
            # Note: Call model now has tenant_id field for proper isolation
        )
        db_session.add(call)
        db_session.flush()  # Don't commit here, let caller do it
        return True
    except Exception as e:
        logger.error(f"Could not create call from voice session {voice_session.id}: {e}")
        return False


def create_conversation_from_voice_session(
    db_session: Session, 
    voice_session: models.VoiceSession, 
    call_summary: Optional[str] = None
) -> bool:
    """
    Helper to create a conversation record from voice session data.
    """
    try:
        # Create or get customer
        customer = get_or_create_customer(
            db_session, 
            voice_session.customer_phone, 
            "Unknown Customer", 
            voice_session.tenant_id
        )

        # Create conversation record
        conversation = models.Conversation(
            id=generate_id("conv"),
            tenant_id=voice_session.tenant_id,
            channel=models.ChannelEnum.voice,  # From voice session
            customer_id=customer.id,
            summary=call_summary or voice_session.summary or "No summary provided",
            sentiment="neutral",  # Default sentiment
            ai_or_human=models.AIOrHumanEnum.AI,  # From voice AI agent
            created_at=voice_session.created_at,
            ended_at=voice_session.ended_at or datetime.now(timezone.utc),
            recording_url=voice_session.conversation_id,  # Use conversation ID for reference
            retention_expires_at=None
        )
        db_session.add(conversation)
        db_session.flush()  # Ensure conversation gets an ID

        # Update the voice session to link to the created conversation
        voice_session.conversation_id = conversation.id

        return True
    except Exception as e:
        logger.error(f"Could not create conversation from voice session {voice_session.id}: {e}")
        return False