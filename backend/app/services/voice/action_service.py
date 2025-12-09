import logging
import secrets
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"

def create_booking_from_conversation(db: Session, session: models.VoiceSession, data: dict):
    if not session.customer_id:
        return

    # Safe extraction of nested values
    raw_date = data.get("preferred_datetime", {}).get("value")
    # Default to tomorrow 10am if not found/parsed
    final_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0)
    
    if raw_date:
        try:
            # Simple ISO parsing attempt
            final_date = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
        except:
            logger.warning(f"Could not parse date: {raw_date}, using default")
            pass

    project = data.get("project", {}).get("value") or "GENERAL"
    
    # Fetch customer for denormalized fields
    cust = db.query(models.Customer).filter(models.Customer.id == session.customer_id).first()
    c_name = cust.name if cust else "Unknown"
    c_phone = cust.phone if cust else ""

    booking = models.Booking(
        id=generate_id("bk"),
        tenant_id=session.tenant_id,
        customer_id=session.customer_id,
        session_id=session.id,
        customer_name=c_name,
        phone=c_phone,
        property_code=project,
        project=project,
        start_date=final_date,
        preferred_datetime=final_date,
        source=models.ChannelEnum.voice,
        created_by=models.AIOrHumanEnum.AI,
        status=models.BookingStatusEnum.pending,
        created_at=datetime.now(timezone.utc)
    )
    db.add(booking)
    logger.info(f"Created booking {booking.id} for session {session.id}")

def create_ticket_from_conversation(db: Session, session: models.VoiceSession, data: dict):
    if not session.customer_id:
        return

    issue = data.get("issue", {}).get("value") or session.summary or "Voice Interaction"
    project = data.get("project", {}).get("value") or "General"
    
    cust = db.query(models.Customer).filter(models.Customer.id == session.customer_id).first()
    
    ticket = models.Ticket(
        id=generate_id("tkt"),
        tenant_id=session.tenant_id,
        customer_id=session.customer_id,
        session_id=session.id,
        customer_name=cust.name if cust else "Unknown",
        phone=cust.phone if cust else "",
        issue=issue,
        project=project,
        category="Voice",
        priority=models.TicketPriorityEnum.med,
        status=models.TicketStatusEnum.open,
        created_at=datetime.now(timezone.utc)
    )
    db.add(ticket)
    logger.info(f"Created ticket {ticket.id} for session {session.id}")

def create_history_records(db: Session, session: models.VoiceSession):
    if not session.customer_id: 
        return

    conv = models.Conversation(
        id=generate_id("conv"),
        tenant_id=session.tenant_id,
        channel=models.ChannelEnum.voice,
        customer_id=session.customer_id,
        summary=session.summary,
        ai_or_human=models.AIOrHumanEnum.AI,
        recording_url=session.conversation_id, # Storing ID as ref for now
        created_at=session.created_at,
        ended_at=session.ended_at or datetime.now(timezone.utc)
    )
    db.add(conv)
    
    call = models.Call(
        id=generate_id("call"),
        tenant_id=session.tenant_id,
        conversation_id=conv.id,
        direction=models.CallDirectionEnum.inbound,
        status=models.CallStatusEnum.connected,
        ai_or_human=models.AIOrHumanEnum.AI,
        created_at=session.created_at
    )
    db.add(call)

def create_full_interaction_record(db: Session, session: models.VoiceSession, customer: models.Customer, data: dict):
    """
    Orchestrator function called by webhook_service to create all necessary
    business records based on the extracted intent.
    """
    # 1. Always create the historical conversation/call records
    create_history_records(db, session)

    # 2. Determine Intent (Booking vs Ticket)
    # The key might vary based on ElevenLabs prompt, but usually it's 'extracted_intent'
    intent_obj = data.get("extracted_intent") 
    intent = intent_obj.get("value") if isinstance(intent_obj, dict) else str(intent_obj)

    logger.info(f"Processing intent '{intent}' for session {session.id}")

    if intent == "book_appointment":
        create_booking_from_conversation(db, session, data)
    elif intent == "raise_ticket":
        create_ticket_from_conversation(db, session, data)
    else:
        # Default behavior if intent is unclear: assume ticket if there is an issue, otherwise just history
        if data.get("issue"):
            create_ticket_from_conversation(db, session, data)