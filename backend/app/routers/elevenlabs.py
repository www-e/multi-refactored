from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import get_session
from app import models
import os
import logging
import aiohttp
from datetime import datetime

router = APIRouter(prefix="/elevenlabs", tags=["elevenlabs"])
logger = logging.getLogger(__name__)

def generate_id(prefix: str) -> str:
    """Generate a unique ID with prefix"""
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

@router.get("/conversations")
async def fetch_elevenlabs_conversations():
    """Fetch real conversation history from ElevenLabs API"""
    try:
        import aiohttp
        
        # Get ElevenLabs API key from environment
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        # ElevenLabs API endpoint for conversations
        url = "https://api.elevenlabs.io/v1/convai/conversations"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Retrieved {len(data.get('conversations', []))} conversations from ElevenLabs")
                    return {
                        "status": "success",
                        "conversations": data.get("conversations", []),
                        "total": len(data.get("conversations", []))
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"ElevenLabs API error {response.status}: {error_text}")
                    raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")
                
    except ImportError:
        raise HTTPException(status_code=500, detail="aiohttp not installed. Run: pip install aiohttp")
    except Exception as e:
        logger.error(f"Error fetching ElevenLabs conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversation/{conversation_id}/process")
async def process_single_conversation(conversation_id: str, db_session: Session = Depends(get_session)):
    """Process a single ElevenLabs conversation and create booking/ticket as needed"""
    try:
        import aiohttp
        
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")
                
                detail_data = await response.json()
                analysis = detail_data.get("analysis", {})
                data_collection = analysis.get("data_collection_results", {})
                
                # Extract key information
                extracted_intent = data_collection.get("extracted_intent", {}).get("value", "")
                customer_name = data_collection.get("customer_name", {}).get("value", "")
                customer_phone = data_collection.get("phone", {}).get("value", "")
                preferred_datetime = data_collection.get("preferred_datetime", {}).get("value", "")
                project = data_collection.get("project", {}).get("value", "")
                issue = data_collection.get("issue", {}).get("value", "")
                priority = data_collection.get("priority", {}).get("value", "")
                
                # Get phone from metadata if missing
                if not customer_phone:
                    phone_metadata = detail_data.get("metadata", {}).get("phone_call", {})
                    external_number = phone_metadata.get("external_number", "")
                    if external_number:
                        customer_phone = external_number
                
                call_summary = analysis.get("call_summary_title", "")
                
                logger.info(f"Processing conversation {conversation_id}: intent={extracted_intent}, project={project}, phone={customer_phone}")
                
                # Check if already processed
                existing_session = db_session.query(models.VoiceSession).filter(
                    models.VoiceSession.conversation_id == conversation_id
                ).first()
                
                if existing_session:
                    # Update existing session
                    existing_session.summary = call_summary
                    existing_session.extracted_intent = extracted_intent
                    existing_session.status = models.VoiceSessionStatus.COMPLETED
                    voice_session = existing_session
                    logger.info(f"Updated existing voice session: {voice_session.id}")
                else:
                    # Create customer if needed
                    customer = None
                    if customer_phone:
                        customer = db_session.query(models.Customer).filter_by(phone=customer_phone).first()
                        if not customer:
                            customer = models.Customer(
                                id=generate_id("cust"),
                                tenant_id="demo-tenant",
                                name=customer_name or f"Customer {customer_phone}",
                                phone=customer_phone,
                                created_at=datetime.utcnow()
                            )
                            db_session.add(customer)
                            db_session.flush()
                    
                    # Create voice session
                    voice_session = models.VoiceSession(
                        id=generate_id("vs"),
                        tenant_id="demo-tenant",
                        customer_id=customer.id if customer else f"unknown_{conversation_id}",
                        conversation_id=conversation_id,
                        agent_id=detail_data.get("agent_id", ""),
                        customer_phone=customer_phone,
                        summary=call_summary,
                        extracted_intent=extracted_intent,
                        status=models.VoiceSessionStatus.COMPLETED,
                        created_at=datetime.utcnow()
                    )
                    db_session.add(voice_session)
                    db_session.flush()
                    logger.info(f"Created voice session: {voice_session.id}")
                
                # Process intent-based actions
                booking_created = False
                ticket_created = False
                
                if customer_phone and extracted_intent == "book_appointment" and preferred_datetime:
                    try:
                        from datetime import datetime as dt
                        appointment_dt = dt.fromisoformat(preferred_datetime.replace('Z', '+00:00'))
                        
                        # Check if booking already exists for this session
                        existing_booking = db_session.query(models.Booking).filter(
                            models.Booking.session_id == voice_session.id
                        ).first()
                        
                        if not existing_booking:
                            customer = db_session.query(models.Customer).filter_by(phone=customer_phone).first()
                            if customer:
                                booking = models.Booking(
                                    id=generate_id("bk"),
                                    tenant_id="demo-tenant",
                                    customer_id=customer.id,
                                    session_id=voice_session.id,
                                    customer_name=customer.name,
                                    phone=customer_phone,
                                    property_code=project or "PROP-DEFAULT",
                                    start_date=appointment_dt.date(),
                                    source=models.ChannelEnum.voice,
                                    created_by=models.AIOrHumanEnum.AI,
                                    project=project or "Voice Agent Booking",
                                    preferred_datetime=appointment_dt,
                                    status=models.BookingStatusEnum.pending,
                                    created_at=datetime.utcnow()
                                )
                                db_session.add(booking)
                                booking_created = True
                                logger.info(f"Created booking for {appointment_dt}")
                        else:
                            logger.info(f"Booking already exists for session {voice_session.id}")
                    except Exception as e:
                        logger.error(f"Error parsing datetime: {e}")
                
                elif customer_phone and extracted_intent == "raise_ticket" and issue:
                    # Check if ticket already exists for this session
                    existing_ticket = db_session.query(models.Ticket).filter(
                        models.Ticket.session_id == voice_session.id
                    ).first()
                    
                    if not existing_ticket:
                        customer = db_session.query(models.Customer).filter_by(phone=customer_phone).first()
                        if customer:
                            priority_map = {"low": models.TicketPriorityEnum.low, "medium": models.TicketPriorityEnum.med, "high": models.TicketPriorityEnum.high}
                            ticket_priority = priority_map.get(priority, models.TicketPriorityEnum.med)
                            
                            ticket = models.Ticket(
                                id=generate_id("tk"),
                                tenant_id="demo-tenant",
                                customer_id=customer.id,
                                category="Voice Support",
                                session_id=voice_session.id,
                                customer_name=customer.name,
                                phone=customer_phone,
                                issue=issue,
                                project=project or "Voice Agent Support",
                                priority=ticket_priority,
                                status=models.TicketStatusEnum.open,
                                created_at=datetime.utcnow()
                            )
                            db_session.add(ticket)
                            ticket_created = True
                            logger.info(f"Created ticket for issue: {issue}")
                    else:
                        logger.info(f"Ticket already exists for session {voice_session.id}")
        
        db_session.commit()
        
        return {
            "status": "success",
            "conversation_id": conversation_id,
            "processed": {
                "intent": extracted_intent,
                "project": project,
                "datetime": preferred_datetime,
                "booking_created": booking_created,
                "ticket_created": ticket_created
            }
        }
        
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error processing conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}/debug")
async def debug_conversation_detail(conversation_id: str):
    """Debug endpoint to see raw conversation detail from ElevenLabs"""
    try:
        import aiohttp
        
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "status": "success",
                        "raw_data": data
                    }
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
