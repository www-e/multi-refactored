import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"

def get_val(data: Dict[str, Any], key: str) -> str:
    obj = data.get(key)
    if obj is None:
        return ""
    if isinstance(obj, dict):
        return str(obj.get("value", "")).strip()
    return str(obj).strip()

def parse_iso_date(date_str: str) -> datetime:
    fallback = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    if not date_str:
        return fallback
    try:
        clean_date = date_str.replace('"', '').replace("'", "").replace("Z", "+00:00").strip()
        if "T" in clean_date:
            return datetime.fromisoformat(clean_date)
        else:
            return datetime.fromisoformat(f"{clean_date}T10:00:00+00:00")
    except Exception as e:
        logger.warning(f"⚠️ Date parse failed for '{date_str}': {e}. Using fallback.")
        return fallback

def create_booking_from_conversation(
    db: Session,
    session: Any,
    customer: models.Customer,
    data: Dict[str, Any]
):
    # Check if a booking already exists for this session to prevent duplicates
    session_id = getattr(session, "id", None)
    if session_id:
        existing_booking = db.query(models.Booking).filter(
            models.Booking.session_id == session_id
        ).first()

        if existing_booking:
            logger.info(f"ℹ️ Booking already exists for session {session_id}, skipping creation.")
            return

    logger.info(f"📅 Creating Booking for: {customer.name}")
    raw_date = get_val(data, "preferred_datetime")
    project_val = get_val(data, "project") or "General Inquiry"
    final_date = parse_iso_date(raw_date)
    is_real_session = hasattr(session, "_sa_instance_state")

    try:
        booking = models.Booking(
            id=generate_id("bk"),
            tenant_id=session.tenant_id,
            customer_id=customer.id,
            session_id=getattr(session, "id", None) if is_real_session else None,
            customer_name=customer.name,
            phone=customer.phone,
            property_code=project_val,
            project=project_val,
            start_date=final_date,
            preferred_datetime=final_date,
            price_sar=0.0,
            source=models.ChannelEnum.voice,
            status=models.BookingStatusEnum.pending,
            created_by=models.AIOrHumanEnum.AI,
            created_at=datetime.now(timezone.utc)
        )
        db.add(booking)
        logger.info(f"✅ Booking Created: {booking.id} @ {final_date}")
    except Exception as e:
        logger.error(f"❌ Booking Creation Failed: {e}", exc_info=True)
        # Don't raise, allow flow to continue (best effort)

def create_ticket_from_conversation(
    db: Session,
    session: Any,
    customer: models.Customer,
    data: Dict[str, Any]
):
    # Check if a ticket already exists for this session to prevent duplicates
    session_id = getattr(session, "id", None)
    if session_id:
        existing_ticket = db.query(models.Ticket).filter(
            models.Ticket.session_id == session_id
        ).first()

        if existing_ticket:
            logger.info(f"ℹ️ Ticket already exists for session {session_id}, skipping creation.")
            return

    logger.info(f"🎫 Creating Ticket for: {customer.name}")
    issue_val = get_val(data, "issue") or getattr(session, "summary", "Voice Interaction Issue")
    project_val = get_val(data, "project") or "General"
    raw_priority = get_val(data, "priority").lower()

    priority_enum = models.TicketPriorityEnum.med
    if "high" in raw_priority or "urgent" in raw_priority:
        priority_enum = models.TicketPriorityEnum.high
    elif "low" in raw_priority:
        priority_enum = models.TicketPriorityEnum.low

    is_real_session = hasattr(session, "_sa_instance_state")

    try:
        ticket = models.Ticket(
            id=generate_id("tkt"),
            tenant_id=session.tenant_id,
            customer_id=customer.id,
            session_id=getattr(session, "id", None) if is_real_session else None,
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
        # Don't raise, allow flow to continue

def create_history_records(db: Session, session: Any, customer: models.Customer):
    """
    Safely creates Conversation and Call records.
    Uses nested transaction (begin_nested) to handle race conditions where 
    ElevenLabs sends duplicate webhooks simultaneously.
    """
    conv_id = getattr(session, "conversation_id", None) or generate_id("conv")
    
    # 1. Ensure Conversation Exists
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
    
    if not conversation:
        try:
            # Create savepoint for safe insertion attempt
            with db.begin_nested():
                conversation = models.Conversation(
                    id=conv_id,
                    tenant_id=session.tenant_id,
                    channel=models.ChannelEnum.voice,
                    customer_id=customer.id,
                    summary=getattr(session, "summary", "Auto-log"),
                    ai_or_human=models.AIOrHumanEnum.AI,
                    created_at=getattr(session, "created_at", datetime.now(timezone.utc)),
                    ended_at=getattr(session, "ended_at", datetime.now(timezone.utc))
                )
                db.add(conversation)
                # Flush to trigger constraint check immediately within nested transaction
                db.flush()
        except IntegrityError:
            # Race condition caught: another request created it just now
            logger.info(f"⚠️ Conversation {conv_id} already exists (race condition), fetching existing.")
            # Re-fetch the conversation that blocked us
            conversation = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
        except Exception as e:
            logger.error(f"❌ Failed to create conversation: {e}")
            return

    # 2. Add Call Record (if conversation exists)
    if conversation:
        # Check if call already logged for this conversation (deduplication)
        existing_call = db.query(models.Call).filter(models.Call.conversation_id == conv_id).first()
        if existing_call:
            logger.info(f"ℹ️ Call record already exists for conversation {conv_id}")
            return

        try:
            # Calculate handle_sec if session has start and end times
            handle_sec = None
            if hasattr(session, 'created_at') and hasattr(session, 'ended_at') and session.created_at and session.ended_at:
                duration_seconds = (session.ended_at - session.created_at).total_seconds()
                handle_sec = int(duration_seconds)

            call = models.Call(
                id=generate_id("call"),
                tenant_id=session.tenant_id,
                conversation_id=conversation.id,
                direction=models.CallDirectionEnum.inbound,
                status=models.CallStatusEnum.connected,
                ai_or_human=models.AIOrHumanEnum.AI,
                handle_sec=handle_sec,
                created_at=datetime.now(timezone.utc)
            )
            db.add(call)
            # We don't strictly need to flush here, main commit will handle it
        except Exception as e:
            logger.error(f"❌ Failed to create call record: {e}")
    else:
        logger.error(f"❌ Could not link Call to Conversation {conv_id} (Missing)")

def create_full_interaction_record(
    db: Session,
    session: Any,
    customer: models.Customer,
    data: Dict[str, Any]
):
    # 1. Log History (Safe Mode)
    create_history_records(db, session, customer)
    
    # 2. Execute Business Logic
    intent = get_val(data, "extracted_intent")
    logger.info(f"🧠 Action Routing: Intent='{intent}'")
    
    if intent == "book_appointment":
        create_booking_from_conversation(db, session, customer, data)
    elif intent == "raise_ticket":
        create_ticket_from_conversation(db, session, customer, data)
    else:
        # Fallback Heuristics
        if get_val(data, "issue"):
            logger.info("↪️ Fallback: Found 'issue', creating Ticket.")
            create_ticket_from_conversation(db, session, customer, data)
        elif get_val(data, "preferred_datetime"):
            logger.info("↪️ Fallback: Found 'date', creating Booking.")
            create_booking_from_conversation(db, session, customer, data)