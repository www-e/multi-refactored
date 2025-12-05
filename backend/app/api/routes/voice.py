# backend/app/api/routes/voice.py
import os
import logging
import aiohttp
import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone
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
def create_voice_session(body: VoiceSessionRequest, tenant_id: str = Depends(deps.get_current_tenant_id), _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    # 1. Handle Customer
    customer = db_session.query(models.Customer).filter(models.Customer.id == body.customer_id).first()
    if not customer:
        customer = models.Customer(
            id=body.customer_id,
            tenant_id=tenant_id,
            name=f"Customer {body.customer_id[:8]}",  # Use a recognizable customer name format
            phone="N/A",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(customer)
        db_session.flush()

    # 2. Create Session
    # CRITICAL: This must start at the same column as 'if not customer:'
    # It must NOT be inside the 'if' block.
    voice_session = models.VoiceSession(
        id=generate_id("vs"),
        tenant_id=tenant_id,
        customer_id=body.customer_id,
        direction="inbound",
        status="active",
        created_at=datetime.now(timezone.utc)
    )

    # Set the conversation_id to match the session ID so webhook can find this session
    voice_session.conversation_id = voice_session.id
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

def _get_or_create_customer(db_session: Session, customer_phone: str, customer_name: str, tenant_id: str = "demo-tenant") -> models.Customer:
    """Finds a customer by phone or creates a new one."""
    customer = db_session.query(models.Customer).filter(models.Customer.phone == customer_phone).first()
    if not customer:
        customer = models.Customer(
            id=generate_id("cust"), tenant_id=tenant_id,
            name=customer_name or f"Customer {customer_phone}",
            phone=customer_phone, created_at=datetime.now(timezone.utc)
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

        customer = _get_or_create_customer(db_session, customer_phone, customer_name, voice_session.tenant_id)

        booking = models.Booking(
            id=generate_id("bk"), tenant_id=voice_session.tenant_id, customer_id=customer.id,
            session_id=voice_session.id, customer_name=customer.name, phone=customer_phone,
            property_code=project or "PROP-DEFAULT", start_date=appointment_dt,
            source=models.ChannelEnum.voice, created_by=models.AIOrHumanEnum.AI,
            project=project or "Voice Booking", preferred_datetime=appointment_dt,
            status=models.BookingStatusEnum.pending, created_at=datetime.now(timezone.utc)
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

        customer = _get_or_create_customer(db_session, customer_phone, customer_name, voice_session.tenant_id)

        ticket = models.Ticket(
            id=generate_id("tkt"), tenant_id=voice_session.tenant_id, customer_id=customer.id,
            session_id=voice_session.id, customer_name=customer.name, phone=customer_phone,
            issue=voice_session.summary or "No summary provided", project=project or "N/A",
            category=data_collection.get("category", {}).get("value", "General"),
            priority=models.TicketPriorityEnum.med, status=models.TicketStatusEnum.open,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(ticket)
        return True
    except Exception as e:
        logger.error(f"Could not create ticket from ElevenLabs data for session {voice_session.id}: {e}")
        return False

def _create_call_from_voice_session(db_session: Session, voice_session: models.VoiceSession, call_summary: str) -> bool:
    """Helper to create a call record from voice session data."""
    try:
        # Only create call if there's a conversation_id (set by _create_conversation_from_voice_session)
        if not voice_session.conversation_id:
            logger.warning(f"Cannot create call for voice session {voice_session.id} - no conversation_id set")
            return False

        # Determine direction based on voice session direction, default to inbound if not specified
        direction = models.CallDirectionEnum.inbound
        if voice_session.direction:
            if voice_session.direction.lower() == "outbound":
                direction = models.CallDirectionEnum.outbound
            elif voice_session.direction.lower() == "inbound":
                direction = models.CallDirectionEnum.inbound

        # Create call record (Call model doesn't have customer_id, only conversation_id)
        call = models.Call(
            id=generate_id("call"),
            tenant_id=voice_session.tenant_id,  # Include tenant_id for proper isolation
            conversation_id=voice_session.conversation_id,
            direction=direction,
            status=models.CallStatusEnum.connected,   # Use valid CallStatusEnum value
            handle_sec=None,      # Not available from voice session
            outcome=None,         # Not available from voice session
            ai_or_human=models.AIOrHumanEnum.AI,  # From voice AI agent
            recording_url=None,   # Will be populated later if recording exists
            retention_expires_at=None
            # Note: Call model now has tenant_id field for proper isolation
        )
        db_session.add(call)
        db_session.commit()  # Commit to ensure the call record is saved
        return True
    except Exception as e:
        logger.error(f"Could not create call from voice session {voice_session.id}: {e}")
        db_session.rollback()  # Rollback on error
        return False

def _create_conversation_from_voice_session(db_session: Session, voice_session: models.VoiceSession, call_summary: str) -> bool:
    """Helper to create a conversation record from voice session data."""
    try:
        # Create or get customer
        customer = _get_or_create_customer(db_session, voice_session.customer_phone, "Unknown Customer", voice_session.tenant_id)

        # Create conversation record
        conversation = models.Conversation(
            id=generate_id("conv"),
            tenant_id=voice_session.tenant_id,
            channel=models.ChannelEnum.voice,  # From voice session
            customer_id=customer.id,
            summary=call_summary,
            sentiment="neutral",  # Default sentiment
            ai_or_human=models.AIOrHumanEnum.AI,  # From voice AI agent
            created_at=voice_session.created_at,
            ended_at=voice_session.ended_at or datetime.now(timezone.utc),
            recording_url=voice_session.conversation_id,  # Use conversation ID for reference
            retention_expires_at=None
        )
        db_session.add(conversation)
        db_session.flush()  # Ensure conversation gets an ID

        # Update the voice session to link to the created conversation
        voice_session.conversation_id = conversation.id

        return True
    except Exception as e:
        logger.error(f"Could not create conversation from voice session {voice_session.id}: {e}")
        return False

@router.post("/elevenlabs/conversation/{conversation_id}/process")
async def process_conversation_fast(conversation_id: str, db_session: Session = Depends(deps.get_session)):
    """
    Webhook endpoint for ElevenLabs conversation processing.
    This is an external webhook, so we don't use authentication dependencies.
    Instead, we securely determine tenant context by looking up the existing voice session.
    """
    from app.api.deps import get_session
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

                # SECURE TENANT RESOLUTION: Look up existing voice session by conversation_id to determine tenant
                voice_session = db_session.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conversation_id).first()
                if voice_session:
                    # Use the tenant_id from the existing voice session
                    tenant_id = voice_session.tenant_id
                    voice_session.summary = call_summary
                    voice_session.extracted_intent = intent
                    voice_session.customer_phone = customer_phone
                    voice_session.status = models.VoiceSessionStatus.COMPLETED
                else:
                    # Create a proper customer record first instead of using an invalid ID
                    temp_customer_id = f"temp_{generate_id('cust')}"  # Use a proper generated ID
                    # For webhook scenarios without tenant context, we should either fail or use tenant from conversation
                    # For now, let's get the tenant_id from the authenticated user context
                    # However, since this is a webhook endpoint, we can't access the current user directly
                    # So we need to handle this differently - but for now, we'll need to find the tenant through the voice session if it exists
                    # Actually, this should be handled properly - we need to pass tenant context or handle this differently
                    # Since this is a webhook, we'll need to determine tenant from other sources
                    # For now, let's try to get it from some context or default to the authenticated user's tenant
                    # Actually, the tenant_id should be passed to the webhook function somehow - let me check how the endpoint is set up
                    # The endpoint doesn't have tenant_id in the function signature, so we need to handle this differently
                    # This is a webhook, so we can't rely on the current user context
                    # So we'll need to either parse from the webhook data or have some other mechanism
                    # If voice session doesn't exist, we should not create a new one from webhook
                    # This ensures security - webhooks can only update existing voice sessions
                    # that were created via authenticated API calls
                    logger.warning(f"Webhook received for non-existent conversation_id: {conversation_id}. This may be an attempt to create unauthorized records.")
                    db_session.commit()  # Commit any previous changes but don't create new entities
                    return {
                        "status": "warning",
                        "conversation_id": conversation_id,
                        "processed": {"message": f"Conversation {conversation_id} not found in database"}
                    }
                    temp_customer = models.Customer(
                        id=temp_customer_id,
                        tenant_id=tenant_id,
                        name="System Generated Customer",
                        phone=customer_phone or "N/A",
                        created_at=datetime.now(timezone.utc)
                    )
                    db_session.add(temp_customer)

                    voice_session = models.VoiceSession(
                        id=generate_id("vs"), tenant_id=tenant_id, customer_id=temp_customer_id,
                        conversation_id=conversation_id, agent_id=data.get("agent_id", ""),
                        customer_phone=customer_phone, summary=call_summary, extracted_intent=intent,
                        status=models.VoiceSessionStatus.COMPLETED, created_at=datetime.now(timezone_utc)
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

                # Always create corresponding Conversation and Call records for voice sessions
                # This ensures they show up in the calls and conversations pages
                # Note: Create Conversation first since Call references it via conversation_id
                conv_success = _create_conversation_from_voice_session(db_session, voice_session, call_summary)
                call_success = _create_call_from_voice_session(db_session, voice_session, call_summary)

                # Log if these operations fail, but continue processing
                if not conv_success:
                    logger.warning(f"Failed to create conversation record for voice session {voice_session.id}")
                if not call_success:
                    logger.warning(f"Failed to create call record for voice session {voice_session.id}")

                db_session.commit()

                return {
                    "status": "success", "conversation_id": conversation_id,
                    "processed": { "intent": intent, "action_type": action_type, "action_taken": action_taken }
                }
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error processing conversation {conversation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def verify_elevenlabs_webhook_signature(request: Request, payload: bytes, signature_header: str) -> bool:
    """
    Verify the HMAC signature of an ElevenLabs webhook.
    ElevenLabs sends format: t=<timestamp>,v0=<signature>
    """
    webhook_secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("ELEVENLABS_WEBHOOK_SECRET not configured")
        return False

    try:
        # Parse the signature header format: "t=timestamp,v0=signature"
        parts = signature_header.split(',')
        timestamp = None
        expected_sig = None

        for part in parts:
            if part.startswith('t='):
                timestamp = part[2:]
            elif part.startswith('v0='):
                expected_sig = part[3:]

        if not expected_sig or not timestamp:
            logger.error(f"Invalid signature format: {signature_header}")
            return False

        # Construct the signed payload: timestamp.body
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

        # Calculate HMAC-SHA256
        calculated_sig = hmac.new(
            key=webhook_secret.encode('utf-8'),
            msg=signed_payload.encode('utf-8'),
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
    This is an external webhook, so we don't use authentication dependencies.
    Instead, we securely determine tenant context by looking up the existing voice session.
    """
    from app.api.deps import get_session  # Import here to avoid circular dependencies
    try:
        # Get the raw body for signature verification
        body = await request.body()

        # Get signature from header - ElevenLabs uses "Elevenlabs-Signature"
        signature = request.headers.get("Elevenlabs-Signature") or request.headers.get("X-Elevenlabs-Hmac-SHA256")
        if not signature:
            logger.warning("Webhook request missing Elevenlabs-Signature header")
            raise HTTPException(status_code=401, detail="Missing signature header")

        # Verify signature
        if not verify_elevenlabs_webhook_signature(request, body, signature):
            logger.error("Webhook signature verification failed")
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse the JSON payload
        import json
        payload = json.loads(body.decode('utf-8'))

        # Log the payload keys to understand structure
        logger.info(f"Received ElevenLabs webhook with keys: {list(payload.keys())}")

        # Try different possible field names for conversation ID
        conversation_id = (
            payload.get("conversation_id") or
            payload.get("conversationId") or
            payload.get("id") or
            payload.get("call_id") or
            payload.get("session_id") or
            # ElevenLabs sends conversation_id nested in the data object
            payload.get("data", {}).get("conversation_id") or
            payload.get("data", {}).get("conversationId") or
            payload.get("data", {}).get("id") or
            payload.get("data", {}).get("call_id") or
            payload.get("data", {}).get("session_id")
        )

        # If still not found, log the full payload (excluding large audio data)
        if not conversation_id:
            safe_payload = {k: v if not isinstance(v, str) or len(str(v)) < 500 else f"<{len(str(v))} chars>"
                           for k, v in payload.items()}
            logger.error(f"Webhook payload missing conversation_id. Full payload: {safe_payload}")
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

                    # SECURE TENANT RESOLUTION: Look up existing voice session by conversation_id to determine tenant
                    voice_session = db_session.query(models.VoiceSession).filter(
                        models.VoiceSession.conversation_id == conversation_id
                    ).first()
                    if voice_session:
                        # Use the tenant_id from the existing voice session
                        tenant_id = voice_session.tenant_id
                        voice_session.summary = call_summary
                        voice_session.extracted_intent = intent
                        voice_session.customer_phone = customer_phone
                        voice_session.status = models.VoiceSessionStatus.COMPLETED
                    else:
                        # If voice session doesn't exist, we should not create a new one from webhook
                        # This ensures security - webhooks can only update existing voice sessions
                        # that were created via authenticated API calls
                        logger.warning(f"Webhook received for non-existent conversation_id: {conversation_id}. This may be an attempt to create unauthorized records.")
                        db_session.commit()  # Commit any previous changes but don't create new entities
                        return {
                            "status": "warning",
                            "conversation_id": conversation_id,
                            "processed": {"message": f"Conversation {conversation_id} not found in database"}
                        }
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

                    # Always create corresponding Conversation and Call records for voice sessions
                    # This ensures they show up in the calls and conversations pages
                    # Note: Create Conversation first since Call references it via conversation_id
                    conv_success = _create_conversation_from_voice_session(db_session, voice_session, call_summary)
                    call_success = _create_call_from_voice_session(db_session, voice_session, call_summary)

                    # Log if these operations fail, but continue processing
                    if not conv_success:
                        logger.warning(f"Failed to create conversation record for voice session {voice_session.id}")
                    if not call_success:
                        logger.warning(f"Failed to create call record for voice session {voice_session.id}")

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