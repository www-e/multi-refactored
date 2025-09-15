from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import os
import logging
import aiohttp
from dotenv import load_dotenv

from app.db import get_session, engine
from app import models

# Minimal logging setup
logging.basicConfig(level=logging.WARNING)  # Reduce log noise
logger = logging.getLogger(__name__)

# Load env once at module level
env_path = os.path.join(os.path.dirname(__file__), "../../../.env.local")
load_dotenv(env_path)

app = FastAPI(title="Voice Agent Portal API")

@app.on_event("startup")
async def startup_event():
    models.Base.metadata.create_all(bind=engine)

# CORS - minimal config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# Shared aiohttp session for efficiency
http_session = None

@app.on_event("startup")
async def create_http_session():
    global http_session
    http_session = aiohttp.ClientSession()

@app.on_event("shutdown")
async def close_http_session():
    if http_session:
        await http_session.close()

# Helper functions
def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

def get_elevenlabs_headers():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    return {"xi-api-key": api_key, "Content-Type": "application/json"}

# Core endpoints only - remove all debug/test endpoints
@app.get("/")
def read_root():
    return {"status": "Voice Agent Portal API", "version": "1.9-optimized"}

@app.get("/healthz")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ONLY essential endpoints - remove redundant ones
@app.get("/bookings")
def get_bookings(limit: int = 50, db_session: Session = Depends(get_session)):
    bookings = db_session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(limit).all()
    
    result = []
    for booking in bookings:
        # Fast Arabic day calculation
        weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        day_name = weekday_map[booking.preferred_datetime.weekday()] if booking.preferred_datetime else ""
        
        result.append({
            "id": booking.id,
            "session_id": booking.session_id,
            "customer_name": booking.customer_name,
            "phone": booking.phone,
            "project": booking.project,
            "preferred_datetime": booking.preferred_datetime.isoformat() if booking.preferred_datetime else None,
            "appointment_date": booking.start_date.isoformat() if booking.start_date else None,
            "appointment_time": booking.preferred_datetime.strftime("%H:%M") if booking.preferred_datetime else None,
            "day_name": day_name,
            "status": booking.status.value if booking.status else "pending",
            "created_at": booking.created_at.isoformat()
        })
    
    return result

@app.get("/tickets")
def get_tickets(limit: int = 50, db_session: Session = Depends(get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(limit).all()
    
    return [{
        "id": ticket.id,
        "category": ticket.category,
        "customer_name": ticket.customer_name,
        "phone": ticket.phone,
        "issue": ticket.issue,
        "project": ticket.project,
        "priority": ticket.priority.value if ticket.priority else "medium",
        "status": ticket.status.value if ticket.status else "open",
        "created_at": ticket.created_at.isoformat()
    } for ticket in tickets]

@app.get("/elevenlabs/conversations")
async def fetch_elevenlabs_conversations():
    """Fast ElevenLabs conversation fetch"""
    try:
        headers = get_elevenlabs_headers()
        url = "https://api.elevenlabs.io/v1/convai/conversations"
        
        async with http_session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "status": "success",
                    "conversations": data.get("conversations", []),
                    "total": len(data.get("conversations", []))
                }
            else:
                raise HTTPException(status_code=response.status, detail="ElevenLabs API error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_fast(conversation_id: str, db_session: Session = Depends(get_session)):
    """Fast single conversation processing - optimized version"""
    try:
        headers = get_elevenlabs_headers()
        url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
        
        # Fast API call
        async with http_session.get(url, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="Failed to fetch conversation")
            
            data = await response.json()
            analysis = data.get("analysis", {})
            data_collection = analysis.get("data_collection_results", {})
            
            # Fast data extraction
            intent = data_collection.get("extracted_intent", {}).get("value", "")
            customer_name = data_collection.get("customer_name", {}).get("value", "")
            customer_phone = data_collection.get("phone", {}).get("value", "")
            preferred_datetime = data_collection.get("preferred_datetime", {}).get("value", "")
            project = data_collection.get("project", {}).get("value", "")
            
            # Get phone from metadata if missing
            if not customer_phone:
                phone_metadata = data.get("metadata", {}).get("phone_call", {})
                customer_phone = phone_metadata.get("external_number", "")
            
            call_summary = analysis.get("call_summary_title", "")
            
            # Fast database operations
            existing_session = db_session.query(models.VoiceSession).filter(
                models.VoiceSession.conversation_id == conversation_id
            ).first()
            
            if existing_session:
                # Quick update
                existing_session.summary = call_summary
                existing_session.extracted_intent = intent
                existing_session.customer_phone = customer_phone
                existing_session.status = models.VoiceSessionStatus.COMPLETED
                voice_session = existing_session
            else:
                # Create new session
                voice_session = models.VoiceSession(
                    id=generate_id("vs"),
                    tenant_id="demo-tenant",
                    customer_id=f"customer_{conversation_id}",
                    conversation_id=conversation_id,
                    agent_id=data.get("agent_id", ""),
                    customer_phone=customer_phone,
                    summary=call_summary,
                    extracted_intent=intent,
                    status=models.VoiceSessionStatus.COMPLETED,
                    created_at=datetime.utcnow()
                )
                db_session.add(voice_session)
                db_session.flush()
            
            booking_created = False
            
            # Fast booking creation for appointments only
            if intent == "book_appointment" and preferred_datetime and customer_phone:
                existing_booking = db_session.query(models.Booking).filter(
                    models.Booking.session_id == voice_session.id
                ).first()
                
                if not existing_booking:
                    try:
                        appointment_dt = datetime.fromisoformat(preferred_datetime.replace('Z', '+00:00'))
                        
                        # Fast customer creation
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
                        
                        # Fast booking creation
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
                            project=project or "Voice Booking",
                            preferred_datetime=appointment_dt,
                            status=models.BookingStatusEnum.pending,
                            created_at=datetime.utcnow()
                        )
                        db_session.add(booking)
                        booking_created = True
                    except Exception:
                        pass  # Skip invalid dates silently
            
            db_session.commit()
            
            return {
                "status": "success",
                "conversation_id": conversation_id,
                "processed": {
                    "intent": intent,
                    "project": project,
                    "datetime": preferred_datetime,
                    "booking_created": booking_created
                }
            }
    
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Remove ALL debug/test/unused endpoints to keep it lean and fast
