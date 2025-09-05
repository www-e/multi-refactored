from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import engine, Base, get_session
from .security import create_access_token, hash_password, generate_id
from . import models
from pydantic import BaseModel
import os
from datetime import datetime
import hmac
import hashlib
import json
from sse_starlette.sse import EventSourceResponse
import asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Navaia Backend", default_response_class=ORJSONResponse)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_methods=["*"],
	allow_headers=["*"]
)

class LoginRequest(BaseModel):
	username: str
	password: str

class LoginResponse(BaseModel):
	token: str
	role: str = "Admin"
	tenant_id: str

@app.get("/healthz")
def healthz():
	return {"status": "ok"}

@app.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
	if req.username and req.password:
		tenant_id = os.getenv("TENANT_ID", "demo-tenant")
		token = create_access_token(subject=req.username, extra={"role": "Admin", "tenant_id": tenant_id})
		return LoginResponse(token=token, tenant_id=tenant_id)
	raise HTTPException(status_code=401, detail="invalid credentials")

# Minimal stubs for core resources
class CreateCustomer(BaseModel):
	name: str
	phone: str
	email: str | None = None
	language: str | None = None

@app.post("/customers")
def create_customer(body: CreateCustomer, session: Session = Depends(get_session)):
	customer = models.Customer(
		id=generate_id("c"),
		tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
		name=body.name,
		phone=body.phone,
		email=body.email,
		language=body.language
	)
	session.add(customer)
	return {"id": customer.id}

@app.get("/customers")
def list_customers(session: Session = Depends(get_session)):
	rows = session.query(models.Customer).order_by(models.Customer.created_at.desc()).limit(100).all()
	return [{"id": r.id, "name": r.name, "phone": r.phone, "created_at": r.created_at.isoformat()} for r in rows]

class CreateBooking(BaseModel):
	customer_id: str
	property_code: str
	start_date: str
	price_sar: float | None = None
	source: models.ChannelEnum
	created_by: models.AIOrHumanEnum

@app.post("/bookings")
def create_booking(body: CreateBooking, session: Session = Depends(get_session)):
	try:
		start_dt = datetime.fromisoformat(body.start_date)
	except Exception:
		raise HTTPException(status_code=422, detail="start_date must be ISO format")
	bk = models.Booking(
		id=generate_id("b"),
		tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
		customer_id=body.customer_id,
		property_code=body.property_code,
		start_date=start_dt,
		price_sar=body.price_sar or 0,
		source=body.source,
		created_by=body.created_by
	)
	session.add(bk)
	return {"id": bk.id, "status": bk.status}

@app.get("/bookings")
def list_bookings(session: Session = Depends(get_session)):
	rows = session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(100).all()
	return [{"id": r.id, "status": r.status, "price_sar": r.price_sar, "created_at": r.created_at.isoformat()} for r in rows]

@app.post("/bookings/{booking_id}/approve")
def approve_booking(booking_id: str, session: Session = Depends(get_session)):
	bk = session.get(models.Booking, booking_id)
	if not bk:
		raise HTTPException(status_code=404, detail="booking not found")
	bk.status = models.BookingStatusEnum.confirmed
	return {"id": bk.id, "status": bk.status}

@app.post("/bookings/{booking_id}/decline")
def decline_booking(booking_id: str, session: Session = Depends(get_session)):
	bk = session.get(models.Booking, booking_id)
	if not bk:
		raise HTTPException(status_code=404, detail="booking not found")
	bk.status = models.BookingStatusEnum.canceled
	return {"id": bk.id, "status": bk.status}

class CreateTicket(BaseModel):
	customer_id: str
	priority: models.TicketPriorityEnum
	category: str
	assignee: str | None = None

@app.post("/tickets")
def create_ticket(body: CreateTicket, session: Session = Depends(get_session)):
	tk = models.Ticket(
		id=generate_id("t"),
		tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
		customer_id=body.customer_id,
		priority=body.priority,
		category=body.category,
		assignee=body.assignee
	)
	session.add(tk)
	return {"id": tk.id, "status": tk.status}

@app.get("/tickets")
def list_tickets(session: Session = Depends(get_session)):
	rows = session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(100).all()
	return [{"id": r.id, "status": r.status, "priority": r.priority, "category": r.category, "created_at": r.created_at.isoformat()} for r in rows]

class UpdateTicket(BaseModel):
	status: models.TicketStatusEnum
	resolution_note: str | None = None
	assignee: str | None = None

@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, body: UpdateTicket, session: Session = Depends(get_session)):
	tk = session.get(models.Ticket, ticket_id)
	if not tk:
		raise HTTPException(status_code=404, detail="ticket not found")
	if body.assignee is not None:
		tk.assignee = body.assignee
	if body.resolution_note is not None:
		tk.resolution_note = body.resolution_note
	tk.status = body.status
	return {"id": tk.id, "status": tk.status}

@app.post("/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: str, session: Session = Depends(get_session)):
	tk = session.get(models.Ticket, ticket_id)
	if not tk:
		raise HTTPException(status_code=404, detail="ticket not found")
	tk.status = models.TicketStatusEnum.resolved
	tk.approved_by = "admin"
	return {"id": tk.id, "status": tk.status}

@app.post("/tickets/{ticket_id}/reject")
def reject_ticket(ticket_id: str, session: Session = Depends(get_session)):
	tk = session.get(models.Ticket, ticket_id)
	if not tk:
		raise HTTPException(status_code=404, detail="ticket not found")
	tk.status = models.TicketStatusEnum.in_progress
	return {"id": tk.id, "status": tk.status}

# Campaigns
class CreateCampaign(BaseModel):
	name: str
	type: models.CampaignTypeEnum
	objective: str
	audience_query: dict | None = None
	schedule: dict | None = None

@app.post("/campaigns")
def create_campaign(body: CreateCampaign, session: Session = Depends(get_session)):
	c = models.Campaign(
		id=generate_id("cmp"),
		tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
		name=body.name,
		type=body.type,
		objective=body.objective,
		audience_query=body.audience_query,
		schedule=body.schedule,
		status="active"
	)
	session.add(c)
	return {"id": c.id}

@app.get("/campaigns")
def list_campaigns(session: Session = Depends(get_session)):
	rows = session.query(models.Campaign).order_by(models.Campaign.created_at.desc()).limit(100).all()
	return [{"id": r.id, "name": r.name, "type": r.type, "objective": r.objective, "status": r.status, "created_at": r.created_at.isoformat()} for r in rows]

@app.post("/campaigns/{campaign_id}/run")
def run_campaign(campaign_id: str, session: Session = Depends(get_session)):
	c = session.get(models.Campaign, campaign_id)
	if not c:
		raise HTTPException(status_code=404, detail="campaign not found")
	m = models.CampaignMetrics(
		campaign_id=c.id,
		reached=100,
		engaged=60,
		qualified=30,
		booked=10,
		revenue_sar=10000.0,
		roas=2.5
	)
	session.add(m)
	return {"status": "ok"}

# Analytics
@app.get("/analytics/dashboard")
def analytics_dashboard(session: Session = Depends(get_session)):
	# bookings revenue
	from sqlalchemy import func
	revenue = session.query(func.coalesce(func.sum(models.Booking.price_sar), 0.0)).scalar() or 0.0
	# roas avg from campaign metrics
	avg_roas = session.query(func.avg(models.CampaignMetrics.roas)).scalar() or 0.0
	# conversion to booking from metrics (booked/engaged)
	totals = session.query(
		func.coalesce(func.sum(models.CampaignMetrics.booked), 0),
		func.coalesce(func.sum(models.CampaignMetrics.engaged), 0)
	).one()
	booked_total, engaged_total = int(totals[0] or 0), int(totals[1] or 0)
	conversion = round((booked_total / engaged_total) * 100, 2) if engaged_total > 0 else 0.0
	# calls KPIs (stub if no data)
	calls_count = session.query(func.count(models.Call.id)).scalar() or 0
	answer_rate = 95 if calls_count == 0 else 90
	avg_handle = session.query(func.avg(models.Call.handle_sec)).scalar() or 0
	csat = 4.4
	return {
		"totalCalls": calls_count,
		"answerRate": answer_rate,
		"avgHandleTime": int(avg_handle),
		"csat": csat,
		"revenue": revenue,
		"roas": float(avg_roas or 0.0),
		"conversionToBooking": conversion
	}





# ElevenLabs Webhooks (HMAC)

def _hmac_valid(secret: str, body: bytes, signature: str) -> bool:
	try:
		expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
		return hmac.compare_digest(expected, signature)
	except Exception:
		return False

@app.post("/webhooks/elevenlabs/call_event")
async def eleven_call_event(request: Request, session: Session = Depends(get_session)):
	secret = os.getenv("ELEVENLABS_HMAC_SECRET", "")
	raw = await request.body()
	sig = request.headers.get("X-Signature", "")
	if not _hmac_valid(secret, raw, sig):
		raise HTTPException(status_code=401, detail="invalid signature")
	payload = json.loads(raw or b"{}")
	evt = models.Event(type="elevenlabs.call_event", payload=payload, tenant_id=os.getenv("TENANT_ID", "demo-tenant"))
	session.add(evt)
	# Optionally react to actions
	return {"status": "ok"}

@app.post("/webhooks/elevenlabs/call_end")
async def eleven_call_end(request: Request, session: Session = Depends(get_session)):
	secret = os.getenv("ELEVENLABS_HMAC_SECRET", "")
	raw = await request.body()
	sig = request.headers.get("X-Signature", "")
	if not _hmac_valid(secret, raw, sig):
		raise HTTPException(status_code=401, detail="invalid signature")
	payload = json.loads(raw or b"{}")
	evt = models.Event(type="elevenlabs.call_end", payload=payload, tenant_id=os.getenv("TENANT_ID", "demo-tenant"))
	session.add(evt)
	return {"status": "ok"}

# Voice Session endpoints
class VoiceSessionRequest(BaseModel):
	agent_type: str
	customer_id: str
	direction: str = "inbound"
	locale: str = "en-US"
	simulation: bool = False

@app.post("/api/backend/voice/sessions")
def create_voice_session(body: VoiceSessionRequest, session: Session = Depends(get_session)):
	"""Create a new voice session"""
	tenant_id = os.getenv("TENANT_ID", "demo-tenant")
	session_id = generate_id("voice_session")
	
	voice_session = models.VoiceSession(
		id=session_id,
		tenant_id=tenant_id,
		customer_id=body.customer_id,
		direction=body.direction,
		locale=body.locale,
		simulation=body.simulation,
		status="created"
	)
	
	session.add(voice_session)
	session.commit()
	
	return {
		"session_id": session_id,
		"customer_id": body.customer_id,
		"direction": body.direction,
		"locale": body.locale,
		"simulation": body.simulation,
		"status": "created",
		"created_at": voice_session.created_at.isoformat()
	}

# Messaging stubs
class MessagingSessionRequest(BaseModel):
	customer_id: str
	simulation: bool = True

@app.post("/messaging/sessions")
def start_messaging_session(body: MessagingSessionRequest):
	return {"session_id": generate_id("chat"), "customer_id": body.customer_id}

@app.post("/webhooks/messaging/event")
async def messaging_event(request: Request, session: Session = Depends(get_session)):
	raw = await request.body()
	payload = json.loads(raw or b"{}")
	evt = models.Event(type="messaging.event", payload=payload, tenant_id=os.getenv("TENANT_ID", "demo-tenant"))
	session.add(evt)
	return {"status": "ok"}

# SSE stream (stub)
@app.get("/conversations/stream")
async def conversations_stream():
	async def event_generator():
		while True:
			yield {
				"event": "keepalive",
				"data": json.dumps({"ts": datetime.utcnow().isoformat()})
			}
			await asyncio.sleep(5)
	return EventSourceResponse(event_generator())

# Voice Session endpoints for ElevenLabs integration
class CreateVoiceSession(BaseModel):
	customer_id: str
	direction: str = "inbound"
	locale: str = "ar-SA"
	simulation: bool = False

class VoiceSessionResponse(BaseModel):
	session_id: str
	status: str
	customer_id: str
	created_at: str

@app.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session(body: CreateVoiceSession, db_session: Session = Depends(get_session)):
	# Create a voice session record
	voice_session = models.VoiceSession(
		id=generate_id("vs"),
		tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
		customer_id=body.customer_id,
		direction=body.direction,
		locale=body.locale,
		status="active",
		simulation=body.simulation
	)
	db_session.add(voice_session)
	db_session.commit()
	
	return VoiceSessionResponse(
		session_id=voice_session.id,
		status=voice_session.status,
		customer_id=voice_session.customer_id,
		created_at=voice_session.created_at.isoformat()
	)

@app.get("/voice/sessions/{session_id}")
def get_voice_session(session_id: str, db_session: Session = Depends(get_session)):
	voice_session = db_session.query(models.VoiceSession).filter(models.VoiceSession.id == session_id).first()
	if not voice_session:
		raise HTTPException(status_code=404, detail="Voice session not found")
	
	return {
		"session_id": voice_session.id,
		"status": voice_session.status,
		"customer_id": voice_session.customer_id,
		"created_at": voice_session.created_at.isoformat()
	}

@app.put("/voice/sessions/{session_id}/end")
def end_voice_session(session_id: str, db_session: Session = Depends(get_session)):
	voice_session = db_session.query(models.VoiceSession).filter(models.VoiceSession.id == session_id).first()
	if not voice_session:
		raise HTTPException(status_code=404, detail="Voice session not found")
	
	voice_session.status = "ended"
	voice_session.ended_at = datetime.utcnow()
	db_session.commit()
	
	return {
		"session_id": voice_session.id,
		"status": voice_session.status
	} 