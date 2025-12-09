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
    try:
        # Default Date: Tomorrow 10 AM
        default_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0)
        
        raw_date = data_collection.get("preferred_datetime", {}).get("value")
        final_date = default_date

        if raw_date:
            try:
                final_date = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
            except:
                logger.warning(f"Date parse error: {raw_date}")

        project_code = (
            data_collection.get("project", {}).get("value") or 
            data_collection.get("property", {}).get("value") or 
            "GENERAL"
        )

        # Get updated customer info
        cust_name = "Unknown"
        if hasattr(voice_session, 'customer_id') and voice_session.customer_id:
            c = db_session.query(models.Customer).filter(models.Customer.id == voice_session.customer_id).first()
            if c: cust_name = c.name

        booking = models.Booking(
            id=generate_id("bk"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id if hasattr(voice_session, 'id') else None,
            customer_name=cust_name,
            phone=voice_session.customer_phone,
            property_code=project_code,
            project=project_code,
            start_date=final_date,
            preferred_datetime=final_date,
            source=models.ChannelEnum.voice,
            created_by=models.AIOrHumanEnum.AI,
            status=models.BookingStatusEnum.pending,
            price_sar=0.0,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(booking)
        logger.info(f"✅ Booking Created: {project_code} for {cust_name}")
        return True
    except Exception as e:
        logger.error(f"Booking error: {e}")
        return False

def create_ticket_from_conversation(
    db_session: Session,
    voice_session: models.VoiceSession,
    data_collection: Dict
) -> bool:
    try:
        issue_text = data_collection.get("issue", {}).get("value")
        if not issue_text:
            issue_text = getattr(voice_session, 'summary', "Voice Request")

        ai_priority = data_collection.get("priority", {}).get("value", "med").lower()
        priority_map = {
            "high": models.TicketPriorityEnum.high,
            "urgent": models.TicketPriorityEnum.urgent,
            "low": models.TicketPriorityEnum.low
        }
        final_priority = priority_map.get(ai_priority, models.TicketPriorityEnum.med)
        
        project_val = data_collection.get("project", {}).get("value") or "General"

        cust_name = "Unknown"
        if hasattr(voice_session, 'customer_id') and voice_session.customer_id:
            c = db_session.query(models.Customer).filter(models.Customer.id == voice_session.customer_id).first()
            if c: cust_name = c.name

        ticket = models.Ticket(
            id=generate_id("tkt"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id if hasattr(voice_session, 'id') else None,
            customer_name=cust_name,
            phone=voice_session.customer_phone,
            issue=issue_text,
            project=project_val,
            category="Maintenance",
            priority=final_priority,
            status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(ticket)
        logger.info(f"✅ Ticket Created: {issue_text}")
        return True
    except Exception as e:
        logger.error(f"Ticket error: {e}")
        return False

def create_history_records(db_session: Session, voice_session: models.VoiceSession):
    try:
        if not hasattr(voice_session, 'id'): return False # Skip for mock sessions
        
        conv_id = generate_id("conv")
        conversation = models.Conversation(
            id=conv_id,
            tenant_id=voice_session.tenant_id,
            channel=models.ChannelEnum.voice,
            customer_id=voice_session.customer_id,
            summary=voice_session.summary or "Voice Call",
            sentiment="neutral",
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=voice_session.created_at or datetime.now(timezone.utc),
            ended_at=voice_session.ended_at or datetime.now(timezone.utc),
            recording_url=voice_session.conversation_id 
        )
        db_session.add(conversation)
        
        call = models.Call(
            id=generate_id("call"),
            tenant_id=voice_session.tenant_id,
            conversation_id=conv_id,
            direction=models.CallDirectionEnum.inbound,
            status=models.CallStatusEnum.connected,
            handle_sec=0,
            outcome=models.CallOutcomeEnum.info,
            ai_or_human=models.AIOrHumanEnum.AI
        )
        db_session.add(call)
        return True
    except Exception as e:
        logger.error(f"History error: {e}")
        return False