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
        # 1. Extract Date - "preferred_datetime": "2025-12-16T14:00:00+00:00"
        raw_date = data_collection.get("preferred_datetime", {}).get("value")
        
        # Default: Tomorrow 10 AM if AI missed the date
        default_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0)
        final_date = default_date

        if raw_date:
            try:
                # Parse ISO string from AI
                final_date = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                logger.info(f"📅 Parsed Appointment Date: {final_date}")
            except Exception as e:
                logger.warning(f"⚠️ Date parse error: {e}. Using default.")

        # 2. Extract Project - "project": "سقيفة 28"
        project_code = (
            data_collection.get("project", {}).get("value") or 
            data_collection.get("property", {}).get("value") or 
            "GENERAL"
        )

        # 3. Get Customer Details (Already updated in previous step)
        customer_name = voice_session.agent_name or "Unknown" # Placeholder, will update from DB relation usually
        customer_phone = voice_session.customer_phone
        
        # Fetch fresh data from DB to be sure
        if voice_session.customer_id:
            cust = db_session.query(models.Customer).filter(models.Customer.id == voice_session.customer_id).first()
            if cust:
                customer_name = cust.name
                customer_phone = cust.phone

        # 4. Create Booking
        booking = models.Booking(
            id=generate_id("bk"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id,
            customer_name=customer_name,
            phone=customer_phone,
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
        logger.info(f"✅ Created Booking [{project_code}] for {final_date}")
        return True
    except Exception as e:
        logger.error(f"❌ Booking creation error: {e}", exc_info=True)
        return False

def create_ticket_from_conversation(
    db_session: Session,
    voice_session: models.VoiceSession,
    data_collection: Dict
) -> bool:
    try:
        # 1. Extract Issue - "issue": "مشكلة الكهرباء"
        issue_text = data_collection.get("issue", {}).get("value")
        if not issue_text:
            # Fallback to summary if specific issue not extracted
            issue_text = voice_session.summary or "New Support Request"

        # 2. Extract Priority - "priority": "high"
        ai_priority = data_collection.get("priority", {}).get("value", "med").lower()
        
        # Map AI string to Enum
        priority_map = {
            "high": models.TicketPriorityEnum.high,
            "urgent": models.TicketPriorityEnum.urgent,
            "low": models.TicketPriorityEnum.low,
            "medium": models.TicketPriorityEnum.med,
            "med": models.TicketPriorityEnum.med
        }
        final_priority = priority_map.get(ai_priority, models.TicketPriorityEnum.med)

        # 3. Extract Project - "project": "سقيفة 28"
        project_val = data_collection.get("project", {}).get("value") or "General"

        # 4. Fetch Customer Info
        customer_name = "Unknown"
        customer_phone = voice_session.customer_phone
        
        if voice_session.customer_id:
            cust = db_session.query(models.Customer).filter(models.Customer.id == voice_session.customer_id).first()
            if cust:
                customer_name = cust.name
                customer_phone = cust.phone

        # 5. Create Ticket
        ticket = models.Ticket(
            id=generate_id("tkt"),
            tenant_id=voice_session.tenant_id,
            customer_id=voice_session.customer_id,
            session_id=voice_session.id,
            customer_name=customer_name,
            phone=customer_phone,
            issue=issue_text,
            project=project_val,
            category="Maintenance", # Default category, could be extracted if added to AI
            priority=final_priority,
            status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )
        
        db_session.add(ticket)
        logger.info(f"✅ Created Ticket [{final_priority.value}] - {issue_text}")
        return True
    except Exception as e:
        logger.error(f"❌ Ticket creation error: {e}", exc_info=True)
        return False

def create_history_records(db_session: Session, voice_session: models.VoiceSession):
    try:
        conv_id = generate_id("conv")
        
        # Create Conversation
        conversation = models.Conversation(
            id=conv_id,
            tenant_id=voice_session.tenant_id,
            channel=models.ChannelEnum.voice,
            customer_id=voice_session.customer_id,
            summary=voice_session.summary or "Voice Call Analysis",
            sentiment="neutral",
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=voice_session.created_at,
            ended_at=voice_session.ended_at or datetime.now(timezone.utc),
            recording_url=voice_session.conversation_id 
        )
        db_session.add(conversation)
        
        # Create Call
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
        logger.error(f"History creation error: {e}")
        return False