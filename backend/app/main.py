from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
import os
import logging
import aiohttp
from dotenv import load_dotenv

from app.db import get_session, engine
from app import models
from app.auth_utils import require_auth, authenticate_user, create_access_token, require_admin, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES

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

# CORS - allow specific origins for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://agentic.navaia.sa",
        "https://agentic.navaia.sa/"
    ],
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

@app.get("/dashboard/kpis")
def get_dashboard_kpis(_=Depends(require_auth), db_session: Session = Depends(get_session)):
    """Get dashboard KPIs calculated from the database"""
    from sqlalchemy import func, extract

    # Calculate total calls from voice sessions
    total_calls = db_session.query(models.VoiceSession).count()

    # Calculate completed calls
    completed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED
    ).count()

    # Calculate answer rate
    answer_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0

    # Calculate conversion to booking
    total_bookings = db_session.query(models.Booking).count()
    conversion_rate = (total_bookings / total_calls * 100) if total_calls > 0 else 0

    # Calculate revenue from bookings
    total_revenue = db_session.query(func.sum(models.Booking.price_sar)).scalar() or 0

    # Calculate average handle time (using a placeholder since we don't have call handle times in the current schema)
    # We'll use a different metric for now - average session duration
    avg_duration_hours = 0  # Placeholder - we don't have duration data in current schema
    avg_handle_time = int(avg_duration_hours * 3600)  # Convert to seconds

    # Calculate CSAT (Customer Satisfaction) - placeholder for now
    csat = 4.2  # Placeholder - would come from a rating system

    # Count missed calls (failed voice sessions)
    missed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.FAILED
    ).count()

    # Count AI transferred calls (this would need more specific logic in a real app)
    # For now, we'll count sessions that have extracted_intent (which might indicate need for transfer)
    ai_transferred = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.extracted_intent.isnot(None)
    ).count()

    # Calculate ROAS (Return on Ad Spend) - placeholder
    roas = total_revenue / 200000  # Assuming marketing spend of 200k for now

    # Get live operations data
    current_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.ACTIVE
    ).limit(5).all()

    # Format current calls for display
    current_calls_formatted = []
    for call in current_calls:
        current_calls_formatted.append({
            "id": call.id,
            "customerName": call.customer_id,  # Use customer_id as name for now
            "duration": "00:00",  # Placeholder - actual duration not available in schema
            "status": "وارد"  # Placeholder - could be "وارد" (inbound) or "فائت" (missed)
        })

    # For AI transferred chats, we'll use tickets for now
    ai_transferred_chats = []
    recent_tickets = db_session.query(models.Ticket).order_by(
        models.Ticket.created_at.desc()
    ).limit(5).all()

    for ticket in recent_tickets[:2]:  # Only 2 as in the mock
        ai_transferred_chats.append({
            "id": ticket.id,
            "customerName": ticket.customer_name or "Unknown",
            "reason": "طلب معلومات مفصلة",  # Placeholder
            "waitingTime": "00:00"  # Placeholder
        })

    # Calculate the response data
    kpis = {
        "totalCalls": total_calls,
        "answerRate": round(answer_rate, 1),
        "conversionToBooking": round(conversion_rate, 1),
        "revenue": int(total_revenue),
        "roas": round(roas, 1),
        "avgHandleTime": avg_handle_time,
        "csat": csat,
        "missedCalls": missed_calls,
        "aiTransferred": ai_transferred,
        "systemStatus": "AI_يعمل",  # Placeholder
        "totalCallsChange": 0,  # Placeholder for comparison with previous period
        "answerRateChange": 0,
        "conversionChange": 0,
        "revenueChange": 0,
        "roasChange": 0.1,  # Placeholder for ROAS change
        "avgHandleTimeChange": -15,  # Placeholder for AHT change (negative is improvement)
        "csatChange": 0.2,  # Placeholder for CSAT change
        "monthlyTarget": 2000000,  # Monthly revenue target
        # Essential funnel metrics that require database queries
        "qualifiedCount": db_session.query(models.Ticket).filter(
            models.Ticket.status != models.TicketStatusEnum.open
        ).count()  # Those who became qualified (based on closed tickets)
    }

    live_ops = {
        "currentCalls": current_calls_formatted,
        "aiTransferredChats": ai_transferred_chats
    }

    return {"kpis": kpis, "liveOps": live_ops}


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


# --- Authentication Endpoints ---

class TokenRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str


@app.post("/auth/token", response_model=TokenResponse)
async def login_for_access_token(form_data: TokenRequest = None, db_session: Session = Depends(get_session)):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db_session, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login time
    user.last_login_at = datetime.utcnow()
    db_session.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreateRequest, db_session: Session = Depends(get_session)):
    """
    Register a new user
    """
    # Check if user already exists
    existing_user = db_session.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Validate password strength
    from app.password_utils import validate_password_strength, hash_password
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Create new user
    user_id = generate_id("usr")
    hashed_password = hash_password(user_data.password)

    db_user = models.User(
        id=user_id,
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name
    )

    db_session.add(db_user)
    db_session.commit()
    db_session.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        name=db_user.name,
        role=db_user.role.value
    )


@app.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Get current user info
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value
    )