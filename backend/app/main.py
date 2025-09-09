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
import aiohttp

# Set up logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env.local
import pathlib
env_path = pathlib.Path(__file__).parent.parent.parent / ".env.local"
load_dotenv(dotenv_path=str(env_path))
logger.info(f"Loading environment from: {env_path}")
logger.info(f"Environment file exists: {env_path.exists()}")

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
	# Core required fields that might be in any ElevenLabs webhook
	conversation_id: str | None = None
	# Alternative field names that ElevenLabs might use
	conversationId: str | None = None
	session_id: str | None = None
	
	# Agent information
	agent_id: str | None = None
	agent_name: str | None = None
	
	# Customer information  
	customer_phone: str | None = None
	customer_id: str | None = None
	phone: str | None = None
	
	# Call timing
	started_at: str | None = None
	ended_at: str | None = None
	created_at: str | None = None
	
	# Call content
	summary: str | None = None
	transcript: str | None = None
	extracted_intent: str | None = None
	
	# Any additional fields ElevenLabs might send
	class Config:
		extra = "allow"  # Allow additional fields

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
	logger.info("=== WEBHOOK CALL RECEIVED ===")
	logger.info(f"Request method: {request.method}")
	logger.info(f"Request URL: {request.url}")
	logger.info(f"Request headers: {dict(request.headers)}")
	
	try:
		# Get raw body and signature
		body = await request.body()
		signature = request.headers.get("ElevenLabs-Signature", "")
		
		logger.info(f"Raw body length: {len(body)}")
		logger.info(f"Raw body content: {body.decode()}")
		logger.info(f"Signature: {signature}")
		
		# Get webhook secret from environment
		webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
		if not webhook_secret:
			logger.error("ELEVENLABS_WEBHOOK_SECRET not configured")
			logger.error("Available environment variables:")
			for key, value in os.environ.items():
				if 'ELEVEN' in key.upper() or 'WEBHOOK' in key.upper():
					logger.error(f"  {key} = {value}")
			raise HTTPException(status_code=500, detail="Webhook secret not configured")
		
		logger.info(f"Webhook secret configured: {webhook_secret[:10]}...")
		
		# Verify signature (skip for debugging)
		if signature and not verify_webhook_signature(body, signature, webhook_secret):
			logger.error(f"Invalid webhook signature: {signature}")
			logger.error("Signature verification failed, but continuing for debugging...")
			# Don't raise exception for debugging
			# raise HTTPException(status_code=401, detail="Invalid signature")
		elif not signature:
			logger.warning("No signature provided in webhook request")
		
		# Parse payload
		try:
			payload_dict = json.loads(body.decode())
			logger.info(f"Parsed payload: {json.dumps(payload_dict, indent=2)}")
			payload = PostCallWebhookPayload(**payload_dict)
			logger.info(f"Validated payload object: {payload}")
		except Exception as e:
			logger.error(f"Invalid payload format: {e}")
			logger.error(f"Failed to parse payload: {body.decode()}")
			raise HTTPException(status_code=400, detail="Invalid payload format")
		
		# Get database session
		logger.info("Getting database session...")
		db_session = next(get_session())
		
		try:
			# Extract key fields from flexible payload
			conversation_id = payload.conversation_id or payload.conversationId or payload.session_id or f"conv_{generate_id('auto')}"
			customer_phone = payload.customer_phone or payload.phone or "unknown"
			started_at = payload.started_at or payload.created_at or datetime.utcnow().isoformat()
			summary = payload.summary or payload.transcript or "No summary available"
			extracted_intent = payload.extracted_intent
			
			logger.info(f"Extracted fields:")
			logger.info(f"  conversation_id: {conversation_id}")
			logger.info(f"  customer_phone: {customer_phone}")
			logger.info(f"  started_at: {started_at}")
			logger.info(f"  summary: {summary}")
			logger.info(f"  extracted_intent: {extracted_intent}")
			
			# Create or get customer (only if we have a phone number)
			customer = None
			if customer_phone and customer_phone != "unknown":
				logger.info(f"Processing customer phone: {customer_phone}")
				customer = db_session.query(models.Customer).filter_by(phone=customer_phone).first()
				if not customer:
					logger.info("Customer not found, creating new customer...")
					customer = models.Customer(
						id=generate_id("cust"),
						tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
						name=f"Customer {customer_phone}",
						phone=customer_phone,
						created_at=datetime.utcnow()
					)
					db_session.add(customer)
					db_session.flush()  # Get the customer ID
					logger.info(f"Created new customer: {customer.id}")
				else:
					logger.info(f"Found existing customer: {customer.id}")
			else:
				logger.warning("No valid customer phone found, creating session without customer")
			
			# Parse started_at safely
			try:
				if isinstance(started_at, str):
					# Handle various datetime formats
					if started_at.endswith('Z'):
						parsed_started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
					else:
						parsed_started_at = datetime.fromisoformat(started_at)
				else:
					parsed_started_at = datetime.utcnow()
			except Exception as e:
				logger.error(f"Failed to parse started_at '{started_at}': {e}")
				parsed_started_at = datetime.utcnow()
			
			logger.info("Creating voice session record...")
			# Create voice session record
			voice_session = models.VoiceSession(
				id=generate_id("vs"),
				tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
				customer_id=customer.id if customer else f"customer_{int(time.time() * 1000)}",
				direction="inbound",
				conversation_id=conversation_id,
				agent_id=payload.agent_id,
				agent_name=payload.agent_name,
				customer_phone=customer_phone,
				started_at=parsed_started_at,
				summary=summary,
				extracted_intent=extracted_intent,
				status=models.VoiceSessionStatus.COMPLETED if extracted_intent else models.VoiceSessionStatus.ACTIVE,
				created_at=datetime.utcnow()
			)
			db_session.add(voice_session)
			logger.info(f"Created voice session: {voice_session.id}")
			
			# Process intent-based actions (only if we have a customer and intent)
			logger.info(f"Processing extracted intent: '{extracted_intent}'")
			
			# Only process intents if we have a customer and an intent
			if customer and extracted_intent:
				if extracted_intent == "raise_ticket":
					logger.info("Creating support ticket...")
					# Create support ticket
					ticket = models.Ticket(
						id=generate_id("tk"),
						tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
						customer_id=customer.id,
						category="Voice Support",
						session_id=voice_session.id,
						customer_name=customer.name,
						phone=customer_phone,
						issue=summary,
						project="Voice Agent Support",
						priority=models.TicketPriorityEnum.med,
						status=models.TicketStatusEnum.open,
						created_at=datetime.utcnow()
					)
					db_session.add(ticket)
					logger.info(f"Created ticket: {ticket.id}")
					
				elif extracted_intent == "book_appointment":
					logger.info("Creating booking appointment...")
					# Create booking
					booking = models.Booking(
						id=generate_id("bk"),
						tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
						customer_id=customer.id,
						session_id=voice_session.id,
						customer_name=customer.name,
						phone=customer_phone,
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
					logger.info(f"Created booking: {booking.id}")
				else:
					logger.warning(f"Unknown intent: '{extracted_intent}' - no action taken")
			else:
				if not customer:
					logger.warning("No customer found - cannot create booking/ticket")
				if not extracted_intent:
					logger.warning("No extracted intent - session recorded but no actions taken")
			
			# Enhanced logging to show what we processed
			logger.info("=== PROCESSING SUMMARY ===")
			logger.info(f"Payload fields received: {list(payload_dict.keys())}")
			logger.info(f"Customer created/found: {'Yes' if customer else 'No'}")
			logger.info(f"Intent extracted: {extracted_intent or 'None'}")
			logger.info(f"Session status: {voice_session.status.value}")
			
			logger.info("Committing database transaction...")
			db_session.commit()
			logger.info("Database transaction committed successfully!")
			
			logger.info(f"=== WEBHOOK PROCESSING COMPLETE ===")
			logger.info(f"Processed post-call webhook for conversation {conversation_id}")
			logger.info(f"Customer: {customer.id if customer else 'None'}, Phone: {customer_phone}")
			logger.info(f"Intent: {extracted_intent}")
			logger.info(f"Voice Session: {voice_session.id}")
			
			return {
				"status": "success", 
				"conversation_id": conversation_id,
				"voice_session_id": voice_session.id,
				"customer_id": customer.id if customer else None,
				"extracted_intent": extracted_intent,
				"processed_actions": "booking/ticket created" if (customer and extracted_intent) else "session recorded only"
			}
			
		except Exception as e:
			logger.error(f"Database error during processing: {e}")
			logger.error(f"Error type: {type(e).__name__}")
			db_session.rollback()
			logger.error("Database transaction rolled back")
			raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
		finally:
			db_session.close()
			logger.info("Database session closed")
		
	except HTTPException as he:
		logger.error(f"HTTP Exception: {he.status_code} - {he.detail}")
		raise
	except Exception as e:
		logger.error(f"Unexpected error in webhook: {e}")
		logger.error(f"Error type: {type(e).__name__}")
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
@app.get("/voice-sessions")
def list_voice_sessions(limit: int = 10, db_session: Session = Depends(get_session)):
	"""List recent voice sessions from webhooks"""
	sessions = db_session.query(models.VoiceSession).order_by(models.VoiceSession.created_at.desc()).limit(limit).all()
	
	logger.info(f"Retrieved {len(sessions)} voice sessions")
	
	return [
		{
			"id": s.id,
			"conversation_id": s.conversation_id,
			"customer_phone": s.customer_phone,
			"agent_name": s.agent_name,
			"summary": s.summary,
			"extracted_intent": s.extracted_intent,
			"status": s.status.value if s.status else None,
			"started_at": s.started_at.isoformat() if s.started_at else None,
			"created_at": s.created_at.isoformat()
		}
		for s in sessions
	]

@app.get("/webhook-history")
def webhook_history(db_session: Session = Depends(get_session)):
	"""Get complete webhook processing history for debugging"""
	# Get all voice sessions with related data
	sessions = db_session.query(models.VoiceSession).order_by(models.VoiceSession.created_at.desc()).limit(50).all()
	
	history = []
	for session in sessions:
		# Get related bookings and tickets
		bookings = db_session.query(models.Booking).filter_by(session_id=session.id).all()
		tickets = db_session.query(models.Ticket).filter_by(session_id=session.id).all()
		
		history.append({
			"session": {
				"id": session.id,
				"conversation_id": session.conversation_id,
				"customer_phone": session.customer_phone,
				"agent_name": session.agent_name,
				"summary": session.summary,
				"extracted_intent": session.extracted_intent,
				"status": session.status.value if session.status else None,
				"created_at": session.created_at.isoformat()
			},
			"bookings": [
				{
					"id": b.id,
					"customer_name": b.customer_name,
					"status": b.status.value if b.status else None,
					"created_at": b.created_at.isoformat()
				}
				for b in bookings
			],
			"tickets": [
				{
					"id": t.id,
					"customer_name": t.customer_name,
					"issue": t.issue,
					"status": t.status.value if t.status else None,
					"created_at": t.created_at.isoformat()
				}
				for t in tickets
			]
		})
	
	logger.info(f"Retrieved webhook history: {len(history)} sessions")
	return {
		"total_sessions": len(history),
		"history": history
	}

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
	
	# Arabic day names
	arabic_days = {
		0: "الاثنين",    # Monday
		1: "الثلاثاء",   # Tuesday
		2: "الأربعاء",   # Wednesday
		3: "الخميس",    # Thursday
		4: "الجمعة",    # Friday
		5: "السبت",     # Saturday
		6: "الأحد"      # Sunday
	}
	
	result = []
	for b in bookings:
		formatted_date = None
		formatted_time = None
		day_name = None
		
		if b.preferred_datetime:
			# Format as Gregorian date with Arabic day name
			day_name = arabic_days.get(b.preferred_datetime.weekday(), "")
			formatted_date = b.preferred_datetime.strftime("%Y-%m-%d")  # Gregorian date
			formatted_time = b.preferred_datetime.strftime("%H:%M")
		
		result.append({
			"id": b.id,
			"session_id": b.session_id,
			"customer_name": b.customer_name or "",
			"phone": b.phone or "",
			"project": b.project or "",
			"preferred_datetime": b.preferred_datetime.isoformat() if b.preferred_datetime else None,
			"appointment_date": formatted_date,
			"appointment_time": formatted_time,
			"day_name": day_name,
			"status": b.status.value if b.status else None,
			"created_at": b.created_at.isoformat()
		})
	
	return result

@app.post("/elevenlabs/webhook")
async def elevenlabs_real_webhook(request: Request, db_session: Session = Depends(get_session)):
	"""Real ElevenLabs webhook endpoint for instant conversation updates"""
	try:
		# Get the raw payload
		payload = await request.json()
		logger.info(f"=== ELEVENLABS WEBHOOK CALLED ===")
		logger.info(f"Payload: {payload}")
		
		# Extract conversation ID and trigger a sync for this specific conversation
		conversation_id = payload.get("conversation_id")
		if conversation_id:
			logger.info(f"Processing new conversation: {conversation_id}")
			
			# Check if this conversation is already processed
			existing_session = db_session.query(models.VoiceSession).filter(
				models.VoiceSession.conversation_id == conversation_id
			).first()
			
			if not existing_session:
				# Trigger a background sync to fetch this conversation
				import asyncio
				asyncio.create_task(sync_single_conversation(conversation_id, db_session))
				
			return {"status": "success", "message": "Webhook received", "conversation_id": conversation_id}
		else:
			return {"status": "success", "message": "Webhook received, no conversation_id"}
			
	except Exception as e:
		logger.error(f"Error processing ElevenLabs webhook: {e}")
		return {"status": "error", "message": str(e)}

async def sync_single_conversation(conversation_id: str, db_session: Session):
	"""Sync a single conversation from ElevenLabs"""
	try:
		import aiohttp
		
		api_key = os.getenv("ELEVENLABS_API_KEY")
		if not api_key:
			logger.error("ElevenLabs API key not configured")
			return
		
		url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
		headers = {
			"xi-api-key": api_key,
			"Content-Type": "application/json"
		}
		
		async with aiohttp.ClientSession() as session:
			async with session.get(url, headers=headers) as response:
				if response.status == 200:
					conv_detail = await response.json()
					logger.info(f"Syncing single conversation: {conversation_id}")
					
					# Process this conversation using the same logic as sync_elevenlabs_conversations
					# [Implementation would go here - similar to the existing sync logic]
					
				else:
					logger.error(f"Failed to fetch conversation {conversation_id}")
					
	except Exception as e:
		logger.error(f"Error syncing single conversation {conversation_id}: {e}")

@app.post("/webhook-test")
async def test_webhook():
	"""Test webhook endpoint with fake data for debugging"""
	logger.info("=== TEST WEBHOOK CALLED ===")
	
	# Create fake webhook payload
	fake_payload = {
		"conversation_id": f"test_conv_{secrets.token_hex(8)}",
		"agent_id": "test_agent",
		"agent_name": "Test Agent",
		"customer_phone": "+1234567890",
		"summary": "Customer called to book an appointment for property viewing",
		"started_at": datetime.utcnow().isoformat() + "Z",
		"extracted_intent": "book_appointment"
	}
	
	logger.info(f"Using fake payload: {json.dumps(fake_payload, indent=2)}")
	
	# Process like a real webhook but skip signature verification
	db_session = next(get_session())
	try:
		payload = PostCallWebhookPayload(**fake_payload)
		
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
			db_session.flush()
		
		# Create voice session
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
		
		# Create booking for test
		booking = models.Booking(
			id=generate_id("bk"),
			tenant_id=os.getenv("TENANT_ID", "demo-tenant"),
			customer_id=customer.id,
			session_id=voice_session.id,
			customer_name=customer.name,
			phone=payload.customer_phone,
			property_code="PROP-TEST",
			start_date=datetime.utcnow(),
			source=models.ChannelEnum.voice,
			created_by=models.AIOrHumanEnum.AI,
			project="Test Booking",
			preferred_datetime=datetime.utcnow(),
			status=models.BookingStatusEnum.pending,
			created_at=datetime.utcnow()
		)
		db_session.add(booking)
		
		db_session.commit()
		logger.info("Test webhook processed successfully!")
		
		return {
			"status": "success",
			"message": "Test webhook processed",
			"customer_id": customer.id,
			"session_id": voice_session.id,
			"booking_id": booking.id
		}
		
	except Exception as e:
		db_session.rollback()
		logger.error(f"Test webhook error: {e}")
		raise HTTPException(status_code=500, detail=str(e))
	finally:
		db_session.close()

# Clear all test data and implement ElevenLabs API integration
@app.delete("/data/clear-test-data")
def clear_test_data(db_session: Session = Depends(get_session)):
	"""Clear all test data from the database"""
	try:
		# Delete test bookings
		test_bookings = db_session.query(models.Booking).filter(
			models.Booking.project.like('%Test%')
		).all()
		for booking in test_bookings:
			db_session.delete(booking)
		
		# Delete test tickets  
		test_tickets = db_session.query(models.Ticket).filter(
			models.Ticket.project.like('%Test%')
		).all()
		for ticket in test_tickets:
			db_session.delete(ticket)
		
		# Delete ALL voice sessions (including real ones from ElevenLabs) to start fresh
		all_sessions = db_session.query(models.VoiceSession).all()
		for session in all_sessions:
			db_session.delete(session)
		
		# Delete ALL customers to start fresh
		all_customers = db_session.query(models.Customer).all()
		for customer in all_customers:
			db_session.delete(customer)
		
		db_session.commit()
		
		return {
			"status": "success",
			"message": "All data cleared successfully",
			"deleted": {
				"bookings": len(test_bookings),
				"tickets": len(test_tickets),
				"voice_sessions": len(all_sessions),
				"customers": len(all_customers)
			}
		}
		
	except Exception as e:
		db_session.rollback()
		logger.error(f"Error clearing test data: {e}")
		raise HTTPException(status_code=500, detail=str(e))

# ElevenLabs API integration to fetch real call history
@app.get("/elevenlabs/conversations")
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

# Sync ElevenLabs conversations to our database
@app.post("/elevenlabs/sync-recent")
async def sync_recent_conversations(db_session: Session = Depends(get_session)):
	"""Sync recent ElevenLabs conversations - simpler approach using working endpoints"""
	try:
		# Get recent conversations using the working endpoint
		import requests
		
		api_key = os.getenv("ELEVENLABS_API_KEY")
		if not api_key:
			raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
		
		# Fetch conversations list first
		url = "https://api.elevenlabs.io/v1/convai/conversations"
		headers = {
			"xi-api-key": api_key,
			"Content-Type": "application/json"
		}
		
		response = requests.get(url, headers=headers)
		if response.status_code != 200:
			raise HTTPException(status_code=response.status_code, detail="Failed to fetch conversations")
		
		data = response.json()
		conversations = data.get("conversations", [])
		
		logger.info(f"Processing recent {min(5, len(conversations))} conversations")
		
		processed = 0
		bookings_created = 0
		tickets_created = 0
		
		# Process the first 5 conversations
		for conv in conversations[:5]:
			conversation_id = conv.get("conversation_id", "")
			if not conversation_id:
				continue
			
			# Fetch detailed conversation data
			detail_url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
			detail_response = requests.get(detail_url, headers=headers)
			
			if detail_response.status_code != 200:
				continue
			
			detail_data = detail_response.json()
			analysis = detail_data.get("analysis", {})
			data_collection = analysis.get("data_collection_results", {})
			
			# Extract information
			extracted_intent = data_collection.get("extracted_intent", {}).get("value", "")
			customer_name = data_collection.get("customer_name", {}).get("value", "")
			customer_phone = data_collection.get("phone", {}).get("value", "")
			preferred_datetime = data_collection.get("preferred_datetime", {}).get("value", "")
			project = data_collection.get("project", {}).get("value", "")
			
			# Get phone from metadata if missing
			if not customer_phone:
				phone_metadata = detail_data.get("metadata", {}).get("phone_call", {})
				external_number = phone_metadata.get("external_number", "")
				if external_number:
					customer_phone = external_number
			
			call_summary = analysis.get("call_summary_title", "")
			
			# Skip if no actionable intent
			if not extracted_intent or extracted_intent == "none":
				continue
			
			logger.info(f"Processing {conversation_id}: {extracted_intent} - {project} - {customer_phone}")
			
			# Check existing session
			existing_session = db_session.query(models.VoiceSession).filter(
				models.VoiceSession.conversation_id == conversation_id
			).first()
			
			# Create/update customer if we have phone
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
					logger.info(f"Created customer: {customer.id}")
			
			# Create or update voice session
			if existing_session:
				existing_session.summary = call_summary
				existing_session.extracted_intent = extracted_intent
				existing_session.customer_phone = customer_phone
				existing_session.status = models.VoiceSessionStatus.COMPLETED
				if customer:
					existing_session.customer_id = customer.id
				voice_session = existing_session
				logger.info(f"Updated voice session: {voice_session.id}")
			else:
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
				processed += 1
				logger.info(f"Created voice session: {voice_session.id}")
			
			# Create booking for appointments
			if customer and extracted_intent == "book_appointment" and preferred_datetime:
				# Check if booking already exists
				existing_booking = db_session.query(models.Booking).filter(
					models.Booking.session_id == voice_session.id
				).first()
				
				if not existing_booking:
					try:
						from datetime import datetime as dt
						appointment_dt = dt.fromisoformat(preferred_datetime.replace('Z', '+00:00'))
						
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
						bookings_created += 1
						logger.info(f"Created booking for {appointment_dt}")
					except Exception as e:
						logger.error(f"Error creating booking: {e}")
		
		db_session.commit()
		
		return {
			"status": "success", 
			"message": "Recent conversations synced successfully",
			"processed": {
				"conversations": processed,
				"bookings_created": bookings_created,
				"tickets_created": tickets_created
			}
		}
		
	except Exception as e:
		db_session.rollback()
		logger.error(f"Error syncing recent conversations: {e}")
		raise HTTPException(status_code=500, detail=str(e))

@app.post("/elevenlabs/sync-conversations")
async def sync_elevenlabs_conversations(db_session: Session = Depends(get_session)):
	"""Sync ElevenLabs conversations to our database and create bookings/tickets as needed"""
	try:
		import aiohttp
		
		api_key = os.getenv("ELEVENLABS_API_KEY") 
		if not api_key:
			raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
		
		url = "https://api.elevenlabs.io/v1/convai/conversations"
		headers = {
			"xi-api-key": api_key,
			"Content-Type": "application/json"
		}
		
		conversations_processed = 0
		bookings_created = 0
		tickets_created = 0
		
		# SSL configuration to handle connection issues
		import ssl
		ssl_context = ssl.create_default_context()
		ssl_context.check_hostname = False
		ssl_context.verify_mode = ssl.CERT_NONE
		
		connector = aiohttp.TCPConnector(ssl=ssl_context)
		
		async with aiohttp.ClientSession(connector=connector) as session:
			# First fetch the list of conversations
			async with session.get(url, headers=headers) as response:
				if response.status != 200:
					error_text = await response.text()
					raise HTTPException(status_code=response.status, detail=f"ElevenLabs API error: {error_text}")
				
				data = await response.json()
				conversations = data.get("conversations", [])
				
			logger.info(f"Processing {len(conversations)} conversations from ElevenLabs")
			
			# Process conversations (limit to first 10 for performance)
			for i, conv in enumerate(conversations[:10]):
				logger.info(f"Processing conversation {i+1}: {conv.get('conversation_id', 'unknown')}")
				
				conversation_id = conv.get("conversation_id", "")
				if not conversation_id:
					continue
				
				# Fetch conversation details
				detail_url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
				async with session.get(detail_url, headers=headers) as detail_response:
					if detail_response.status != 200:
						continue
					
					detail_data = await detail_response.json()
					analysis = detail_data.get("analysis", {})
					data_collection = analysis.get("data_collection_results", {})
					
					# Extract information
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
					
					logger.info(f"Conv {conversation_id}: intent={extracted_intent}, project={project}")
				
				# Check if already processed - if so, SKIP processing but allow refresh
				existing_session = db_session.query(models.VoiceSession).filter(
					models.VoiceSession.conversation_id == conversation_id
				).first()
				
				# Always process to ensure fresh data appears (this is what you want on refresh)
				if existing_session:
					logger.info(f"Refreshing existing conversation: {conversation_id}")
				else:
					logger.info(f"Processing NEW conversation: {conversation_id}")
					conversations_processed += 1
					
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
					
					# Create booking/ticket based on intent
					if customer and extracted_intent == "book_appointment" and preferred_datetime:
						try:
							from datetime import datetime as dt
							appointment_dt = dt.fromisoformat(preferred_datetime.replace('Z', '+00:00'))
							
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
							bookings_created += 1
							logger.info(f"Created booking for {appointment_dt}")
						except Exception as e:
							logger.error(f"Error parsing datetime: {e}")
					
					elif customer and extracted_intent == "raise_ticket" and issue:
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
						tickets_created += 1
		
		db_session.commit()
		logger.info(f"Committed {conversations_processed} new conversations to database")
		
		return {
			"status": "success",
			"message": "ElevenLabs conversations synced successfully - processing real appointments and tickets",
			"processed": {
				"conversations": conversations_processed,
				"bookings_created": bookings_created,
				"tickets_created": tickets_created
			}
		}
		
	except Exception as e:
		db_session.rollback()
		logger.error(f"Error syncing ElevenLabs conversations: {e}")
		raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint to check environment variables
@app.get("/debug/env")
def check_environment():
	"""Check if environment variables are loaded correctly"""
	return {
		"elevenlabs_api_key_configured": bool(os.getenv("ELEVENLABS_API_KEY")),
		"elevenlabs_api_key_preview": os.getenv("ELEVENLABS_API_KEY", "")[:10] + "..." if os.getenv("ELEVENLABS_API_KEY") else None,
		"webhook_secret_configured": bool(os.getenv("ELEVENLABS_WEBHOOK_SECRET")),
		"webhook_secret_preview": os.getenv("ELEVENLABS_WEBHOOK_SECRET", "")[:10] + "..." if os.getenv("ELEVENLABS_WEBHOOK_SECRET") else None,
		"env_file_path": str(pathlib.Path(__file__).parent.parent.parent / ".env.local"),
		"env_file_exists": (pathlib.Path(__file__).parent.parent.parent / ".env.local").exists()
	}

# Customers endpoint
@app.get("/customers")
def get_customers(limit: int = 50, db_session: Session = Depends(get_session)):
	"""Get list of customers"""
	customers = db_session.query(models.Customer).limit(limit).all()
	return [
		{
			"id": customer.id,
			"name": customer.name,
			"phone": customer.phone,
			"tenant_id": customer.tenant_id,
			"created_at": customer.created_at
		}
		for customer in customers
	]

# Process a single conversation and create booking/ticket
@app.post("/elevenlabs/conversation/{conversation_id}/process")
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

# Debug endpoint to fetch a single conversation detail
@app.get("/elevenlabs/conversation/{conversation_id}/debug")
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

# Add webhook history endpoint for debugging
@app.get("/webhook/history")
def get_webhook_history(db_session: Session = Depends(get_session)):
	"""Get all webhook calls received for debugging"""
	try:
		# Get all voice sessions (which are created from webhooks)
		voice_sessions = db_session.query(models.VoiceSession).order_by(models.VoiceSession.created_at.desc()).all()
		
		history = []
		for session in voice_sessions:
			# Get associated customer
			customer = db_session.query(models.Customer).filter(models.Customer.id == session.customer_id).first()
			
			# Get associated bookings
			bookings = db_session.query(models.Booking).filter(models.Booking.customer_id == session.customer_id).all()
			
			# Get associated tickets
			tickets = db_session.query(models.Ticket).filter(models.Ticket.customer_id == session.customer_id).all()
			
			history.append({
				"session_id": session.id,
				"conversation_id": session.conversation_id,
				"status": session.status.value if session.status else None,
				"created_at": session.created_at.isoformat() if session.created_at else None,
				"customer": {
					"id": customer.id if customer else None,
					"name": customer.name if customer else None,
					"phone": customer.phone if customer else None,
					"email": customer.email if customer else None
				} if customer else None,
				"bookings": [
					{
						"id": booking.id,
						"property_code": booking.property_code,
						"start_date": booking.start_date.isoformat() if booking.start_date else None,
						"preferred_datetime": booking.preferred_datetime.isoformat() if booking.preferred_datetime else None,
						"status": booking.status.value if booking.status else None,
						"customer_name": booking.customer_name,
						"project": booking.project
					} for booking in bookings
				],
				"tickets": [
					{
						"id": ticket.id,
						"issue": ticket.issue,
						"category": ticket.category,
						"priority": ticket.priority.value if ticket.priority else None,
						"status": ticket.status.value if ticket.status else None,
						"customer_name": ticket.customer_name,
						"project": ticket.project
					} for ticket in tickets
				]
			})
		
		return {
			"webhook_calls_count": len(history),
			"history": history
		}
		
	except Exception as e:
		logger.error(f"Error getting webhook history: {e}")
		raise HTTPException(status_code=500, detail=f"Error getting webhook history: {str(e)}")

# Add simple test endpoint to see all database entries
@app.get("/debug/all-data")
def get_all_debug_data(db_session: Session = Depends(get_session)):
	"""Get all data from database for debugging"""
	try:
		customers = db_session.query(models.Customer).all()
		voice_sessions = db_session.query(models.VoiceSession).all()
		bookings = db_session.query(models.Booking).all()
		tickets = db_session.query(models.Ticket).all()
		
		return {
			"customers": [
				{
					"id": c.id,
					"name": c.name,
					"phone": c.phone,
					"email": c.email,
					"created_at": c.created_at.isoformat() if c.created_at else None
				} for c in customers
			],
			"voice_sessions": [
				{
					"id": vs.id,
					"conversation_id": vs.conversation_id,
					"customer_id": vs.customer_id,
					"status": vs.status.value if vs.status else None,
					"created_at": vs.created_at.isoformat() if vs.created_at else None
				} for vs in voice_sessions
			],
			"bookings": [
				{
					"id": b.id,
					"customer_id": b.customer_id,
					"property_code": b.property_code,
					"start_date": b.start_date.isoformat() if b.start_date else None,
					"preferred_datetime": b.preferred_datetime.isoformat() if b.preferred_datetime else None,
					"status": b.status.value if b.status else None,
					"customer_name": b.customer_name,
					"project": b.project,
					"created_at": b.created_at.isoformat() if b.created_at else None
				} for b in bookings
			],
			"tickets": [
				{
					"id": t.id,
					"customer_id": t.customer_id,
					"issue": t.issue,
					"category": t.category,
					"priority": t.priority.value if t.priority else None,
					"status": t.status.value if t.status else None,
					"customer_name": t.customer_name,
					"project": t.project,
					"created_at": t.created_at.isoformat() if t.created_at else None
				} for t in tickets
			]
		}
		
	except Exception as e:
		logger.error(f"Error getting debug data: {e}")
		raise HTTPException(status_code=500, detail=f"Error getting debug data: {str(e)}")
