from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import logging
import time
from datetime import datetime
from app.db import get_session, engine
from app import models
import random
import os
import secrets
import hmac
import hashlib
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path="../.env.local")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Voice Agent Portal API")

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    models.Base.metadata.create_all(bind=engine)

# Configure CORS
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],  # Configure appropriately for production
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Webhook validation helper
def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
	"""Verify ElevenLabs webhook signature using HMAC SHA256."""
	try:
		# ElevenLabs sends the signature as "sha256=<hex_digest>"
		if not signature.startswith("sha256="):
			return False
		
		expected_signature = signature[7:]  # Remove "sha256=" prefix
		computed_signature = hmac.new(
			secret.encode(),
			payload,
			hashlib.sha256
		).hexdigest()
		
		return hmac.compare_digest(expected_signature, computed_signature)
	except Exception as e:
		logger.error(f"Signature verification error: {e}")
		return False

# Helper function to generate IDs
def generate_id(prefix: str) -> str:
	"""Generate a random ID with the given prefix."""
	return f"{prefix}_{secrets.token_hex(8)}"

# Pydantic models for webhooks
class PostCallWebhookPayload(BaseModel):
	conversation_id: str
	agent_id: str
	agent_name: str
	customer_phone: str
	summary: str
	started_at: str
	extracted_intent: str

class VoiceSessionRequest(BaseModel):
	agent_type: str
	customer_id: str

class VoiceSessionResponse(BaseModel):
	session_id: str
	status: str
	agent_type: str
	customer_id: str
	created_at: str

# Root endpoint
@app.get("/")
async def root():
	return {"message": "Voice Agent Portal API", "status": "active"}

# Health check endpoint
@app.get("/healthz")
async def health_check():
	return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Post-call webhook endpoint
@app.post("/voice/post_call")
async def post_call_webhook(request: Request):
	"""Handle post-call webhooks from ElevenLabs with HMAC verification."""
	try:
		# Get raw body and signature
		body = await request.body()
		signature = request.headers.get("ElevenLabs-Signature", "")
		
		# Get webhook secret from environment
		webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
		if not webhook_secret:
			logger.error("ELEVENLABS_WEBHOOK_SECRET not configured")
			raise HTTPException(status_code=500, detail="Webhook secret not configured")
		
		# Verify signature
		if not verify_webhook_signature(body, signature, webhook_secret):
			logger.error(f"Invalid webhook signature: {signature}")
			raise HTTPException(status_code=401, detail="Invalid signature")
		
		# Parse payload
		try:
			payload_dict = json.loads(body.decode())
			payload = PostCallWebhookPayload(**payload_dict)
		except Exception as e:
			logger.error(f"Invalid payload format: {e}")
			raise HTTPException(status_code=400, detail="Invalid payload format")
		
		# Get database session
		db_session = next(get_session())
		
		try:
			# Create or get customer
			customer = db_session.query(models.Customer).filter_by(phone=payload.customer_phone).first()
			if not customer:
				customer = models.Customer(
					id=generate_id("cust"),
					tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
					name=f"Customer {payload.customer_phone}",
					phone=payload.customer_phone,
					created_at=datetime.utcnow()
				)
				db_session.add(customer)
				db_session.flush()  # Get the customer ID
			
			# Create voice session record
			voice_session = models.VoiceSession(
				id=generate_id("vs"),
				tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
				customer_id=customer.id,
				direction="inbound",
				conversation_id=payload.conversation_id,
				agent_id=payload.agent_id,
				agent_name=payload.agent_name,
				customer_phone=payload.customer_phone,
				started_at=datetime.fromisoformat(payload.started_at.replace('Z', '+00:00')),
				summary=payload.summary,
				extracted_intent=payload.extracted_intent,
				status=models.VoiceSessionStatus.COMPLETED,
				created_at=datetime.utcnow()
			)
			db_session.add(voice_session)
			
			# Process intent-based actions
			if payload.extracted_intent == "raise_ticket":
				# Create support ticket
				ticket = models.Ticket(
					id=generate_id("tk"),
					tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
					customer_id=customer.id,
					category="Voice Support",
					session_id=voice_session.id,
					customer_name=customer.name,
					phone=payload.customer_phone,
					issue=payload.summary,
					project="Voice Agent Support",
					priority=models.TicketPriorityEnum.med,
					status=models.TicketStatusEnum.open,
					created_at=datetime.utcnow()
				)
				db_session.add(ticket)
				
			elif payload.extracted_intent == "book_appointment":
				# Create booking
				booking = models.Booking(
					id=generate_id("bk"),
					tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
					customer_id=customer.id,
					session_id=voice_session.id,
					customer_name=customer.name,
					phone=payload.customer_phone,
					property_code="PROP-DEFAULT",
					start_date=datetime.utcnow(),
					source=models.ChannelEnum.voice,
					created_by=models.AIOrHumanEnum.AI,
					project="Voice Agent Booking",
					preferred_datetime=datetime.utcnow(),  # Default to now, should be extracted from conversation
					status=models.BookingStatusEnum.pending,
					created_at=datetime.utcnow()
				)
				db_session.add(booking)
			
			db_session.commit()
			
			logger.info(f"Processed post-call webhook for conversation {payload.conversation_id}")
			return {"status": "success", "conversation_id": payload.conversation_id}
			
		except Exception as e:
			db_session.rollback()
			logger.error(f"Database error: {e}")
			raise HTTPException(status_code=500, detail="Database error")
		finally:
			db_session.close()
		
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"Unexpected error in webhook: {e}")
		raise HTTPException(status_code=500, detail="Internal server error")

# Mock chat completions endpoint for development
@app.post("/chat/completions")
async def chat_completions(request: Request):
	body = await request.json()
	
	messages = body.get("messages", [])
	user_message = messages[-1].get("content", "") if messages else ""
	
	# Simple mock responses based on keywords
	if "ticket" in user_message.lower() or "support" in user_message.lower():
		response = "I understand you need support. I've created a ticket for your issue and our team will get back to you shortly."
	elif "booking" in user_message.lower() or "appointment" in user_message.lower():
		response = "I can help you schedule an appointment. Let me book that for you right away."
	else:
		response = "Thank you for contacting us. How can I assist you today?"
	
	return {
		"id": f"chatcmpl-{secrets.token_hex(8)}",
		"object": "chat.completion",
		"created": int(time.time()),
		"model": "gpt-3.5-turbo",
		"choices": [{
			"index": 0,
			"message": {
				"role": "assistant",
				"content": response
			},
			"finish_reason": "stop"
		}],
		"usage": {
			"prompt_tokens": 10,
			"completion_tokens": 20,
			"total_tokens": 30
		}
	}

# Mock endpoints for compatibility with the frontend
@app.get("/analytics")
async def analytics():
	return {
		"total_calls": 150,
		"successful_calls": 142,
		"average_duration": "3:24",
		"success_rate": 94.7
	}

@app.get("/call-logs")
async def call_logs():
	return [
		{"id": 1, "customer": "+1234567890", "duration": "3:45", "status": "completed", "timestamp": "2024-01-20T10:30:00Z"},
		{"id": 2, "customer": "+0987654321", "duration": "2:15", "status": "completed", "timestamp": "2024-01-20T11:15:00Z"}
	]

@app.get("/settings")
async def settings():
	return {
		"voice_model": "eleven_turbo_v2",
		"language": "en",
		"response_time": "fast"
	}

@app.post("/campaigns")
async def create_campaign(request: Request):
	data = await request.json()
	return {"id": f"camp_{secrets.token_hex(6)}", "status": "created", **data}

@app.get("/conversations")
async def conversations():
	return [
		{"id": 1, "customer": "John Doe", "status": "active", "started_at": "2024-01-20T10:00:00Z"},
		{"id": 2, "customer": "Jane Smith", "status": "completed", "started_at": "2024-01-20T09:30:00Z"}
	]

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

# Voice session endpoints
@app.post("/voice/sessions", response_model=VoiceSessionResponse)
def create_voice_session(body: VoiceSessionRequest, session: Session = Depends(get_session)):
	voice_session = models.VoiceSession(
		id=generate_id("vs"),
		tenant_id="demo-tenant",
		customer_id=body.customer_id,
		direction="inbound",
		conversation_id=generate_id("conv"),
		status=models.VoiceSessionStatus.ACTIVE
	)
	session.add(voice_session)
	session.commit()
	session.refresh(voice_session)
	
	return VoiceSessionResponse(
		session_id=voice_session.id,
		status=voice_session.status.value,
		agent_type=body.agent_type,
		customer_id=body.customer_id,
		created_at=voice_session.created_at.isoformat()
	)

# Webhook data endpoints
@app.get("/voice_sessions")
def list_voice_sessions(limit: int = 10, db_session: Session = Depends(get_session)):
	"""List recent voice sessions from webhooks"""
	sessions = db_session.query(models.VoiceSession)\
		.filter(models.VoiceSession.conversation_id.isnot(None))\
		.order_by(models.VoiceSession.created_at.desc())\
		.limit(limit)\
		.all()
	
	return [
		{
			"id": s.id,
			"conversation_id": s.conversation_id,
			"agent_id": s.agent_id,
			"agent_name": s.agent_name,
			"customer_phone": s.customer_phone,
			"summary": s.summary,
			"extracted_intent": s.extracted_intent,
			"status": s.status.value if s.status else None,
			"started_at": s.started_at.isoformat() if s.started_at else None,
			"created_at": s.created_at.isoformat()
		}
		for s in sessions
	]

@app.get("/tickets")
def list_tickets(limit: int = 10, db_session: Session = Depends(get_session)):
	"""List recent tickets from webhooks"""
	tickets = db_session.query(models.Ticket)\
		.filter(models.Ticket.session_id.isnot(None))\
		.order_by(models.Ticket.created_at.desc())\
		.limit(limit)\
		.all()
	
	return [
		{
			"id": t.id,
			"session_id": t.session_id,
			"customer_name": t.customer_name,
			"phone": t.phone,
			"issue": t.issue,
			"priority": t.priority.value if t.priority else None,
			"project": t.project,
			"status": t.status.value if t.status else None,
			"created_at": t.created_at.isoformat()
		}
		for t in tickets
	]

@app.get("/bookings")
def list_bookings(limit: int = 10, db_session: Session = Depends(get_session)):
	"""List recent bookings from webhooks"""
	bookings = db_session.query(models.Booking)\
		.filter(models.Booking.session_id.isnot(None))\
		.order_by(models.Booking.created_at.desc())\
		.limit(limit)\
		.all()
	
	return [
		{
			"id": b.id,
			"session_id": b.session_id,
			"customer_name": b.customer_name,
			"phone": b.phone,
			"project": b.project,
			"preferred_datetime": b.preferred_datetime.isoformat() if b.preferred_datetime else None,
			"status": b.status.value if b.status else None,
			"created_at": b.created_at.isoformat()
		}
		for b in bookings
	]

class BookingUpdate(BaseModel):
	status: str = Field(..., description="New status for the booking")

@app.patch("/bookings/{booking_id}")
def update_booking(booking_id: str, update: BookingUpdate, db_session: Session = Depends(get_session)):
	"""Update booking status (approve/deny)"""
	booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id).first()
	
	if not booking:
		raise HTTPException(status_code=404, detail="Booking not found")
	
	try:
		# Update status using enum
		booking.status = models.BookingStatus(update.status)
		db_session.commit()
		
		return {
			"id": booking.id,
			"status": booking.status.value,
			"message": f"Booking {booking_id} updated successfully"
		}
	except ValueError as e:
		raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
	except Exception as e:
		db_session.rollback()
		raise HTTPException(status_code=500, detail=f"Error updating booking: {str(e)}")

class TicketUpdate(BaseModel):
	status: str = Field(..., description="New status for the ticket")

@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate, db_session: Session = Depends(get_session)):
	"""Update ticket status (approve/deny)"""
	ticket = db_session.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
	
	if not ticket:
		raise HTTPException(status_code=404, detail="Ticket not found")
	
	try:
		# Update status using enum
		ticket.status = models.TicketStatus(update.status)
		db_session.commit()
		
		return {
			"id": ticket.id,
			"status": ticket.status.value,
			"message": f"Ticket {ticket_id} updated successfully"
		}
	except ValueError as e:
		raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
	except Exception as e:
		db_session.rollback()
		raise HTTPException(status_code=500, detail=f"Error updating ticket: {str(e)}")
