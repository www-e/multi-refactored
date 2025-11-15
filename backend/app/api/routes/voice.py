# backend/app/api/routes/voice.py
import os
import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app import models
from app.api import deps

router = APIRouter()

# Helper function
def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

# --- Pydantic Models ---
class VoiceSessionRequest(BaseModel):
    agent_type: str
    customer_id: str

class VoiceSessionResponse(BaseModel):
    session_id: str
    status: str
    agent_type: str
    customer_id: str
    created_at: str

# --- Voice Session Endpoint ---
@router.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session(body: VoiceSessionRequest, _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    voice_session = models.VoiceSession(
        id=generate_id("vs"),
        tenant_id="demo-tenant", 
        customer_id=body.customer_id,
        direction="inbound",
        status="active",
        created_at=datetime.utcnow()
    )
    db_session.add(voice_session)
    db_session.commit()
    db_session.refresh(voice_session)
    
    return VoiceSessionResponse(
        session_id=voice_session.id,
        status=voice_session.status,
        agent_type=body.agent_type,
        customer_id=body.customer_id,
        created_at=voice_session.created_at.isoformat()
    )

# --- ElevenLabs Endpoints ---
def get_elevenlabs_headers():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    return {"xi-api-key": api_key, "Content-Type": "application/json"}

@router.get("/elevenlabs/conversations")
async def fetch_elevenlabs_conversations(_=Depends(deps.get_current_user)):
    headers = get_elevenlabs_headers()
    url = "https://api.elevenlabs.io/v1/convai/conversations"
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="ElevenLabs API error")
            data = await response.json()
            return {"status": "success", "conversations": data.get("conversations", [])}

@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_fast(conversation_id: str, _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    headers = get_elevenlabs_headers()
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    
    try:
        async with aiohttp.ClientSession() as http_session:
            async with http_session.get(url, headers=headers) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Failed to fetch conversation from ElevenLabs")
                
                data = await response.json()
                analysis = data.get("analysis", {})
                data_collection = analysis.get("data_collection_results", {})
                
                intent = data_collection.get("extracted_intent", {}).get("value", "")
                customer_name = data_collection.get("customer_name", {}).get("value", "")
                customer_phone = data_collection.get("phone", {}).get("value", "")
                preferred_datetime_str = data_collection.get("preferred_datetime", {}).get("value", "")
                project = data_collection.get("project", {}).get("value", "")
                
                if not customer_phone:
                    phone_metadata = data.get("metadata", {}).get("phone_call", {})
                    customer_phone = phone_metadata.get("external_number", "")
                
                call_summary = analysis.get("call_summary_title", "")
                
                # Find or create VoiceSession
                voice_session = db_session.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conversation_id).first()
                if voice_session:
                    voice_session.summary = call_summary
                    voice_session.extracted_intent = intent
                    voice_session.customer_phone = customer_phone
                    voice_session.status = models.VoiceSessionStatus.COMPLETED
                else:
                    voice_session = models.VoiceSession(
                        id=generate_id("vs"), tenant_id="demo-tenant", customer_id=f"customer_{conversation_id}",
                        conversation_id=conversation_id, agent_id=data.get("agent_id", ""),
                        customer_phone=customer_phone, summary=call_summary, extracted_intent=intent,
                        status=models.VoiceSessionStatus.COMPLETED, created_at=datetime.utcnow()
                    )
                    db_session.add(voice_session)
                db_session.flush() # Ensure voice_session has an ID before creating booking

                booking_created = False
                if intent == "book_appointment" and preferred_datetime_str and customer_phone:
                    # Check if a booking already exists for this session
                    existing_booking = db_session.query(models.Booking).filter(models.Booking.session_id == voice_session.id).first()
                    if not existing_booking:
                        try:
                            appointment_dt = datetime.fromisoformat(preferred_datetime_str.replace('Z', '+00:00'))
                            
                            # Find or create Customer
                            customer = db_session.query(models.Customer).filter(models.Customer.phone == customer_phone).first()
                            if not customer:
                                customer = models.Customer(
                                    id=generate_id("cust"), tenant_id="demo-tenant",
                                    name=customer_name or f"Customer {customer_phone}",
                                    phone=customer_phone, created_at=datetime.utcnow()
                                )
                                db_session.add(customer)
                                db_session.flush() # Ensure customer has an ID
                            
                            booking = models.Booking(
                                id=generate_id("bk"), tenant_id="demo-tenant", customer_id=customer.id,
                                session_id=voice_session.id, customer_name=customer.name, phone=customer_phone,
                                property_code=project or "PROP-DEFAULT", start_date=appointment_dt,
                                source=models.ChannelEnum.voice, created_by=models.AIOrHumanEnum.AI,
                                project=project or "Voice Booking", preferred_datetime=appointment_dt,
                                status=models.BookingStatusEnum.pending, created_at=datetime.utcnow()
                            )
                            db_session.add(booking)
                            booking_created = True
                        except Exception as e:
                            # Log booking creation error but don't crash the whole process
                            print(f"Could not create booking from ElevenLabs data: {e}")
                
                db_session.commit()
                
                return {
                    "status": "success", "conversation_id": conversation_id,
                    "processed": {
                        "intent": intent, "project": project,
                        "datetime": preferred_datetime_str, "booking_created": booking_created
                    }
                }
    
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))