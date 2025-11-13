from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import os
import logging
import aiohttp
from dotenv import load_dotenv

from app.db import get_session, engine
from app import models
from app.auth_utils import require_auth

# Minimal logging setup
logging.basicConfig(level=logging.WARNING)
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

# --- Pydantic Models for our new endpoints ---
class BookingStatusUpdateRequest(BaseModel):
    status: models.BookingStatusEnum

class TicketStatusUpdateRequest(BaseModel):
    status: models.TicketStatusEnum

class VoiceSessionRequest(BaseModel):
    agent_type: str
    customer_id: str

class VoiceSessionResponse(BaseModel):
    session_id: str
    status: str
    agent_type: str
    customer_id: str
    created_at: str

# --- API Endpoints ---

@app.get("/")
def read_root(_=Depends(require_auth)):
    return {"status": "Voice Agent Portal API", "version": "1.9-optimized"}

@app.get("/healthz")
def health_check():
    """Health check endpoint - does not require authentication for monitoring tools"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/ready")
def ready_check():
    """Readiness check endpoint - does not require authentication for load balancers"""
    # Check if database is available
    try:
        db = next(get_session())
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"status": "not_ready", "error": str(e), "timestamp": datetime.utcnow().isoformat()}

@app.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session(_=Depends(require_auth), body: VoiceSessionRequest = None, session: Session = Depends(get_session)):
    voice_session = models.VoiceSession(
        id=generate_id("vs"),
        tenant_id="demo-tenant", 
        customer_id=body.customer_id,
        direction="inbound",
        status="active",
        created_at=datetime.utcnow()
    )
    session.add(voice_session)
    session.commit()
    session.refresh(voice_session)
    
    return VoiceSessionResponse(
        session_id=voice_session.id,
        status=voice_session.status,
        agent_type=body.agent_type,
        customer_id=body.customer_id,
        created_at=voice_session.created_at.isoformat()
    )

# --- Booking Endpoints ---

@app.get("/bookings")
def get_bookings(_=Depends(require_auth), limit: int = 50, db_session: Session = Depends(get_session)):
    bookings = db_session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(limit).all()
    
    result = []
    for booking in bookings:
        weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        day_name = weekday_map[booking.preferred_datetime.weekday()] if booking.preferred_datetime else ""
        
        result.append({
            "id": booking.id, "session_id": booking.session_id, "customer_name": booking.customer_name,
            "phone": booking.phone, "project": booking.project,
            "preferred_datetime": booking.preferred_datetime.isoformat() if booking.preferred_datetime else None,
            "appointment_date": booking.start_date.isoformat() if booking.start_date else None,
            "appointment_time": booking.preferred_datetime.strftime("%H:%M") if booking.preferred_datetime else None,
            "day_name": day_name, "status": booking.status.value if booking.status else "pending",
            "created_at": booking.created_at.isoformat()
        })
    
    return result

@app.get("/bookings/recent")
def get_recent_bookings(_=Depends(require_auth), db_session: Session = Depends(get_session)):
    bookings = db_session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(10).all()
    
    result = []
    for booking in bookings:
        weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        day_name = weekday_map[booking.preferred_datetime.weekday()] if booking.preferred_datetime else ""
        
        result.append({
            "id": booking.id, "session_id": booking.session_id, "customer_name": booking.customer_name,
            "phone": booking.phone, "project": booking.project,
            "preferred_datetime": booking.preferred_datetime.isoformat() if booking.preferred_datetime else None,
            "appointment_date": booking.start_date.isoformat() if booking.start_date else None,
            "appointment_time": booking.preferred_datetime.strftime("%H:%M") if booking.preferred_datetime else None,
            "day_name": day_name, "status": booking.status.value if booking.status else "pending",
            "created_at": booking.created_at.isoformat()
        })
    
    return result

# --- NEW: BOOKING STATUS UPDATE ENDPOINT ---
@app.patch("/bookings/{booking_id}")
def update_booking_status(_=Depends(require_auth), booking_id: str = None, body: BookingStatusUpdateRequest = None, db_session: Session = Depends(get_session)):
    booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    booking.status = body.status
    db_session.commit()
    db_session.refresh(booking)
    
    return {"message": "Booking status updated successfully", "id": booking.id, "new_status": booking.status.value}

# --- Ticket Endpoints ---

@app.get("/tickets")
def get_tickets(_=Depends(require_auth), limit: int = 50, db_session: Session = Depends(get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(limit).all()
    
    return [{"id": t.id, "category": t.category, "customer_name": t.customer_name, "phone": t.phone, "issue": t.issue, "project": t.project, "priority": t.priority.value if t.priority else "medium", "status": t.status.value if t.status else "open", "created_at": t.created_at.isoformat()} for t in tickets]

@app.get("/tickets/recent")
def get_recent_tickets(_=Depends(require_auth), db_session: Session = Depends(get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(10).all()
    
    return [{"id": t.id, "category": t.category, "customer_name": t.customer_name, "phone": t.phone, "issue": t.issue, "project": t.project, "priority": t.priority.value if t.priority else "medium", "status": t.status.value if t.status else "open", "created_at": t.created_at.isoformat()} for t in tickets]

# --- NEW: TICKET STATUS UPDATE ENDPOINT ---
@app.patch("/tickets/{ticket_id}")
def update_ticket_status(_=Depends(require_auth), ticket_id: str = None, body: TicketStatusUpdateRequest = None, db_session: Session = Depends(get_session)):
    ticket = db_session.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = body.status
    db_session.commit()
    db_session.refresh(ticket)
    
    return {"message": "Ticket status updated successfully", "id": ticket.id, "new_status": ticket.status.value}

# --- ElevenLabs Endpoints ---

@app.get("/elevenlabs/conversations")
async def fetch_elevenlabs_conversations(_=Depends(require_auth)):
    try:
        headers = get_elevenlabs_headers()
        url = "https://api.elevenlabs.io/v1/convai/conversations"
        async with http_session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return {"status": "success", "conversations": data.get("conversations", []), "total": len(data.get("conversations", []))}
            else:
                raise HTTPException(status_code=response.status, detail="ElevenLabs API error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_fast(_=Depends(require_auth), conversation_id: str = None, db_session: Session = Depends(get_session)):
    try:
        headers = get_elevenlabs_headers()
        url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
        
        async with http_session.get(url, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="Failed to fetch conversation")
            
            data = await response.json()
            analysis = data.get("analysis", {})
            data_collection = analysis.get("data_collection_results", {})
            
            intent = data_collection.get("extracted_intent", {}).get("value", "")
            customer_name = data_collection.get("customer_name", {}).get("value", "")
            customer_phone = data_collection.get("phone", {}).get("value", "")
            preferred_datetime = data_collection.get("preferred_datetime", {}).get("value", "")
            project = data_collection.get("project", {}).get("value", "")
            
            if not customer_phone:
                phone_metadata = data.get("metadata", {}).get("phone_call", {})
                customer_phone = phone_metadata.get("external_number", "")
            
            call_summary = analysis.get("call_summary_title", "")
            
            existing_session = db_session.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conversation_id).first()
            
            if existing_session:
                existing_session.summary = call_summary
                existing_session.extracted_intent = intent
                existing_session.customer_phone = customer_phone
                existing_session.status = models.VoiceSessionStatus.COMPLETED
                voice_session = existing_session
            else:
                voice_session = models.VoiceSession(id=generate_id("vs"), tenant_id="demo-tenant", customer_id=f"customer_{conversation_id}", conversation_id=conversation_id, agent_id=data.get("agent_id", ""), customer_phone=customer_phone, summary=call_summary, extracted_intent=intent, status=models.VoiceSessionStatus.COMPLETED, created_at=datetime.utcnow())
                db_session.add(voice_session)
                db_session.flush()
            
            booking_created = False
            
            if intent == "book_appointment" and preferred_datetime and customer_phone:
                existing_booking = db_session.query(models.Booking).filter(models.Booking.session_id == voice_session.id).first()
                if not existing_booking:
                    try:
                        appointment_dt = datetime.fromisoformat(preferred_datetime.replace('Z', '+00:00'))
                        customer = db_session.query(models.Customer).filter_by(phone=customer_phone).first()
                        if not customer:
                            customer = models.Customer(id=generate_id("cust"), tenant_id="demo-tenant", name=customer_name or f"Customer {customer_phone}", phone=customer_phone, created_at=datetime.utcnow())
                            db_session.add(customer)
                            db_session.flush()
                        
                        booking = models.Booking(id=generate_id("bk"), tenant_id="demo-tenant", customer_id=customer.id, session_id=voice_session.id, customer_name=customer.name, phone=customer_phone, property_code=project or "PROP-DEFAULT", start_date=appointment_dt.date(), source=models.ChannelEnum.voice, created_by=models.AIOrHumanEnum.AI, project=project or "Voice Booking", preferred_datetime=appointment_dt, status=models.BookingStatusEnum.pending, created_at=datetime.utcnow())
                        db_session.add(booking)
                        booking_created = True
                    except Exception:
                        pass
            
            db_session.commit()
            
            return {"status": "success", "conversation_id": conversation_id, "processed": {"intent": intent, "project": project, "datetime": preferred_datetime, "booking_created": booking_created}}
    
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))