# backend/app/api/routes/voice.py
import os
import logging
import aiohttp
import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app import models
from app.api import deps

# Use structured logging instead of print statements
logger = logging.getLogger(__name__)

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

def _get_or_create_customer(db_session: Session, customer_phone: str, customer_name: str) -> models.Customer:
    """Finds a customer by phone or creates a new one."""
    customer = db_session.query(models.Customer).filter(models.Customer.phone == customer_phone).first()
    if not customer:
        customer = models.Customer(
            id=generate_id("cust"), tenant_id="demo-tenant",
            name=customer_name or f"Customer {customer_phone}",
            phone=customer_phone, created_at=datetime.utcnow()
        )
        db_session.add(customer)
        db_session.flush() # Ensure customer has an ID
    return customer

def _create_booking_from_conversation(db_session: Session, voice_session: models.VoiceSession, data_collection: dict) -> bool:
    """Helper to create a booking from conversation data."""
    customer_phone = voice_session.customer_phone
    preferred_datetime_str = data_collection.get("preferred_datetime", {}).get("value", "")
    if not (preferred_datetime_str and customer_phone):
        return False

    existing_booking = db_session.query(models.Booking).filter(models.Booking.session_id == voice_session.id).first()
    if existing_booking:
        return False # Already created

    try:
        appointment_dt = datetime.fromisoformat(preferred_datetime_str.replace('Z', '+00:00'))
        customer_name = data_collection.get("customer_name", {}).get("value", "")
        project = data_collection.get("project", {}).get("value", "")

        customer = _get_or_create_customer(db_session, customer_phone, customer_name)

        booking = models.Booking(
            id=generate_id("bk"), tenant_id="demo-tenant", customer_id=customer.id,
            session_id=voice_session.id, customer_name=customer.name, phone=customer_phone,
            property_code=project or "PROP-DEFAULT", start_date=appointment_dt,
            source=models.ChannelEnum.voice, created_by=models.AIOrHumanEnum.AI,
            project=project or "Voice Booking", preferred_datetime=appointment_dt,
            status=models.BookingStatusEnum.pending, created_at=datetime.utcnow()
        )
        db_session.add(booking)
        return True
    except Exception as e:
        logger.error(f"Could not create booking from ElevenLabs data for session {voice_session.id}: {e}")
        return False

def _create_ticket_from_conversation(db_session: Session, voice_session: models.VoiceSession, data_collection: dict) -> bool:
    """Helper to create a ticket from conversation data."""
    customer_phone = voice_session.customer_phone
    if not customer_phone:
        return False

    existing_ticket = db_session.query(models.Ticket).filter(models.Ticket.session_id == voice_session.id).first()
    if existing_ticket:
        return False # Already created

    try:
        customer_name = data_collection.get("customer_name", {}).get("value", "")
        project = data_collection.get("project", {}).get("value", "")

        customer = _get_or_create_customer(db_session, customer_phone, customer_name)

        ticket = models.Ticket(
            id=generate_id("tkt"), tenant_id="demo-tenant", customer_id=customer.id,
            session_id=voice_session.id, customer_name=customer.name, phone=customer_phone,
            issue=voice_session.summary or "No summary provided", project=project or "N/A",
            category=data_collection.get("category", {}).get("value", "General"),
            priority=models.TicketPriorityEnum.med, status=models.TicketStatusEnum.open,
            created_at=datetime.utcnow()
        )
        db_session.add(ticket)
        return True
    except Exception as e:
        logger.error(f"Could not create ticket from ElevenLabs data for session {voice_session.id}: {e}")
        return False

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
                # PRODUCTION LOGGING: Log the entire raw payload for debugging
                logger.info(f"Received ElevenLabs webhook payload for {conversation_id}: {data}")

                analysis = data.get("analysis", {})
                data_collection = analysis.get("data_collection_results", {})
                intent = data_collection.get("extracted_intent", {}).get("value", "unknown_intent")
                customer_phone = data_collection.get("phone", {}).get("value", "")
                if not customer_phone:
                    phone_metadata = data.get("metadata", {}).get("phone_call", {})
                    customer_phone = phone_metadata.get("external_number", "")
                call_summary = analysis.get("call_summary_title", "")

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
                db_session.flush()

                action_taken = False
                action_type = "none"

                if intent == "book_appointment":
                    action_taken = _create_booking_from_conversation(db_session, voice_session, data_collection)
                    action_type = "booking"
                elif intent == "raise_ticket":
                    action_taken = _create_ticket_from_conversation(db_session, voice_session, data_collection)
                    action_type = "ticket"
                else:
                    # PRODUCTION FIX: Log unhandled intents to diagnose mismatches
                    logger.warning(f"Unhandled intent '{intent}' for conversation {conversation_id}. No action taken.")

                db_session.commit()

                return {
                    "status": "success", "conversation_id": conversation_id,
                    "processed": { "intent": intent, "action_type": action_type, "action_taken": action_taken }
                }
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error processing conversation {conversation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def verify_elevenlabs_webhook_signature(request: Request, payload: bytes, expected_signature: str) -> bool:
    """
    Verify the HMAC signature of an ElevenLabs webhook.
    Expected signature format: v1=<HMAC-SHA256(sig, secret)>
    """
    webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("ELEVENLABS_WEBHOOK_SECRET not configured")
        return False

    try:
        # Expected format: v1=signature
        if expected_signature.startswith("v1="):
            expected_sig = expected_signature[3:]  # Remove "v1=" prefix
        else:
            logger.error(f"Unexpected signature format: {expected_signature}")
            return False

        # Calculate HMAC-SHA256 of payload
        calculated_sig = hmac.new(
            key=webhook_secret.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()

        # Compare signatures securely
        return hmac.compare_digest(calculated_sig, expected_sig)
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {e}")
        return False

@router.post("/voice/post_call")
async def handle_elevenlabs_webhook(request: Request):
    """
    Webhook endpoint for ElevenLabs post-call data.
    Receives webhook calls from ElevenLabs after conversation ends.
    """
    from app.api.deps import get_session  # Import here to avoid circular dependencies
    try:
        # Get the raw body for signature verification
        body = await request.body()

        # Get signature from header
        signature = request.headers.get("X-Elevenlabs-Hmac-SHA256")
        if not signature:
            logger.warning("Webhook request missing X-Elevenlabs-Hmac-SHA256 header")
            raise HTTPException(status_code=401, detail="Missing signature header")

        # Verify signature
        if not verify_elevenlabs_webhook_signature(request, body, signature):
            logger.error("Webhook signature verification failed")
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse the JSON payload
        import json
        payload = json.loads(body.decode('utf-8'))

        # Log the entire payload for debugging
        logger.info(f"Received ElevenLabs webhook payload: {payload}")

        # Extract conversation data
        conversation_id = payload.get("conversation_id")
        if not conversation_id:
            logger.error("Webhook payload missing conversation_id")
            raise HTTPException(status_code=400, detail="Missing conversation_id in payload")

        # Process the conversation - reuse existing logic
        headers = get_elevenlabs_headers()
        url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch conversation {conversation_id} from ElevenLabs: {response.status}")
                    raise HTTPException(status_code=500, detail="Failed to fetch conversation from ElevenLabs")

                data = await response.json()

                # Process the conversation data using existing logic
                db_session = next(get_session())
                try:
                    analysis = data.get("analysis", {})
                    data_collection = analysis.get("data_collection_results", {})
                    intent = data_collection.get("extracted_intent", {}).get("value", "unknown_intent")
                    customer_phone = data_collection.get("phone", {}).get("value", "")
                    if not customer_phone:
                        phone_metadata = data.get("metadata", {}).get("phone_call", {})
                        customer_phone = phone_metadata.get("external_number", "")
                    call_summary = analysis.get("call_summary_title", "")

                    voice_session = db_session.query(models.VoiceSession).filter(
                        models.VoiceSession.conversation_id == conversation_id
                    ).first()
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
                    db_session.flush()

                    action_taken = False
                    action_type = "none"

                    if intent == "book_appointment":
                        action_taken = _create_booking_from_conversation(db_session, voice_session, data_collection)
                        action_type = "booking"
                    elif intent == "raise_ticket":
                        action_taken = _create_ticket_from_conversation(db_session, voice_session, data_collection)
                        action_type = "ticket"
                    else:
                        # Log unhandled intents to diagnose mismatches
                        logger.warning(f"Unhandled intent '{intent}' for conversation {conversation_id}. No action taken.")

                    db_session.commit()

                    return {
                        "status": "success",
                        "conversation_id": conversation_id,
                        "processed": {
                            "intent": intent,
                            "action_type": action_type,
                            "action_taken": action_taken
                        }
                    }
                except Exception as e:
                    db_session.rollback()
                    logger.error(f"Error processing webhook for conversation {conversation_id}: {e}", exc_info=True)
                    raise HTTPException(status_code=500, detail=str(e))
                finally:
                    db_session.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing ElevenLabs webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing webhook")