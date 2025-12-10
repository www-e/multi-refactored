import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"

def get_val(data: Dict[str, Any], key: str) -> str:
    """
    Robustly extracts value from ElevenLabs tool output.
    Handles:
    1. {"value": "some_data"} (Nested dict)
    2. "some_data" (Direct string)
    3. None
    """
    obj = data.get(key)
    if obj is None:
        return ""
    if isinstance(obj, dict):
        return str(obj.get("value", "")).strip()
    return str(obj).strip()

def parse_iso_date(date_str: str) -> datetime:
    """
    Attempts to parse ISO date from AI.
    Fallback: Tomorrow at 10:00 AM
    """
    fallback = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    
    if not date_str:
        return fallback
    
    try:
        # Clean extra quotes and handle Z
        clean_date = date_str.replace('"', '').replace("'", "").replace("Z", "+00:00").strip()
        
        # Handle simple date (YYYY-MM-DD) vs full ISO
        if "T" in clean_date:
            return datetime.fromisoformat(clean_date)
        else:
            return datetime.fromisoformat(f"{clean_date}T10:00:00+00:00")
            
    except Exception as e:
        logger.warning(f"⚠️ Date parse failed for '{date_str}': {e}. Using fallback.")
        return fallback

def create_booking_from_conversation(
    db: Session, 
    session: Any, # Can be VoiceSession or MockSession
    customer: models.Customer, 
    data: Dict[str, Any]
):
    """Creates a booking using the EXPLICIT customer object."""
    logger.info(f"📅 Creating Booking for: {customer.name}")

    # 1. Extract Data
    raw_date = get_val(data, "preferred_datetime")
    project_val = get_val(data, "project") or "General Inquiry"
    
    # 2. Parse Date
    final_date = parse_iso_date(raw_date)

    # 3. Create Record
    # Note: We check if session is a real DB object before linking the FK
    is_real_session = hasattr(session, "_sa_instance_state")
    
    try:
        booking = models.Booking(
            id=generate_id("bk"),
            tenant_id=session.tenant_id,
            customer_id=customer.id, # Uses the explicitly passed customer
            session_id=session.id if is_real_session else None, # Don't link FK if it's a ghost session
            customer_name=customer.name,
            phone=customer.phone,
            property_code=project_val,
            project=project_val,
            start_date=final_date,
            preferred_datetime=final_date,
            source=models.ChannelEnum.voice,
            created_by=models.AIOrHumanEnum.AI,
            status=models.BookingStatusEnum.pending,
            created_at=datetime.now(timezone.utc)
        )
        db.add(booking)
        logger.info(f"✅ Booking Created: {booking.id} @ {final_date}")
    except Exception as e:
        logger.error(f"❌ Booking Creation Failed: {e}", exc_info=True)
        raise e

def create_ticket_from_conversation(
    db: Session, 
    session: Any, 
    customer: models.Customer, 
    data: Dict[str, Any]
):
    """Creates a ticket using the EXPLICIT customer object."""
    logger.info(f"🎫 Creating Ticket for: {customer.name}")

    # 1. Extract Data
    issue_val = get_val(data, "issue") or getattr(session, "summary", "Voice Interaction Issue")
    project_val = get_val(data, "project") or "General"
    raw_priority = get_val(data, "priority").lower()

    # 2. Map Priority (Handles your specific 'high' case)
    priority_enum = models.TicketPriorityEnum.med
    if "high" in raw_priority or "urgent" in raw_priority:
        priority_enum = models.TicketPriorityEnum.high
    elif "low" in raw_priority:
        priority_enum = models.TicketPriorityEnum.low

    # 3. Create Record
    is_real_session = hasattr(session, "_sa_instance_state")

    try:
        ticket = models.Ticket(
            id=generate_id("tkt"),
            tenant_id=session.tenant_id,
            customer_id=customer.id,
            session_id=session.id if is_real_session else None,
            customer_name=customer.name,
            phone=customer.phone,
            issue=issue_val,
            project=project_val,
            category="Voice Support",
            priority=priority_enum,
            status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )
        db.add(ticket)
        logger.info(f"✅ Ticket Created: {ticket.id} (Priority: {priority_enum.value})")
    except Exception as e:
        logger.error(f"❌ Ticket Creation Failed: {e}", exc_info=True)
        raise e

def create_history_records(db: Session, session: Any, customer: models.Customer):
    """Creates Conversation and Call logs for the timeline."""
    try:
        conv_id = getattr(session, "conversation_id", None) or generate_id("conv")
        
        # Check existence to avoid PK error
        existing = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
        if existing:
            return 

        conv = models.Conversation(
            id=conv_id,
            tenant_id=session.tenant_id,
            channel=models.ChannelEnum.voice,
            customer_id=customer.id,
            summary=getattr(session, "summary", "Auto-log"),
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=getattr(session, "created_at", datetime.now(timezone.utc)),
            ended_at=getattr(session, "ended_at", datetime.now(timezone.utc))
        )
        db.add(conv)
        
        call = models.Call(
            id=generate_id("call"),
            tenant_id=session.tenant_id,
            conversation_id=conv.id,
            direction=models.CallDirectionEnum.inbound,
            status=models.CallStatusEnum.connected,
            ai_or_human=models.AIOrHumanEnum.AI
        )
        db.add(call)
    except Exception as e:
        logger.warning(f"⚠️ History Log Error: {e}")

def create_full_interaction_record(
    db: Session, 
    session: Any, 
    customer: models.Customer, 
    data: Dict[str, Any]
):
    """
    Router for AI Intents. Decides what to create.
    """
    # 1. Log History (Best Effort)
    create_history_records(db, session, customer)

    # 2. Identify Intent
    intent = get_val(data, "extracted_intent")
    logger.info(f"🧠 Action Routing: Intent='{intent}'")

    if intent == "book_appointment":
        create_booking_from_conversation(db, session, customer, data)
    elif intent == "raise_ticket":
        create_ticket_from_conversation(db, session, customer, data)
    else:
        # Fallback Logic: Look for clues if intent is missing
        if get_val(data, "issue"):
            logger.info("↪️ Fallback: Found 'issue', creating Ticket.")
            create_ticket_from_conversation(db, session, customer, data)
        elif get_val(data, "preferred_datetime"):
            logger.info("↪️ Fallback: Found 'date', creating Booking.")
            create_booking_from_conversation(db, session, customer, data)