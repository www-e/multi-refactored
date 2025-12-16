import logging
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, Tuple
from types import SimpleNamespace

from app import models
from .elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    fetch_conversation_recording,
    extract_conversation_data,
    extract_conversation_id_from_payload,
    extract_recording_url_from_conversation,
    extract_transcript_from_conversation
)
from .customer_service import upsert_customer
from .action_service import create_full_interaction_record

logger = logging.getLogger(__name__)
DEFAULT_TENANT_ID = os.getenv("TENANT_ID", "demo-tenant")


class WebhookValidationHandler:
    """Handles webhook payload validation and duplicate detection."""
    
    @staticmethod
    def validate_payload(payload: Dict[str, Any]) -> Optional[str]:
        """Validate payload and extract conversation ID."""
        conv_id = extract_conversation_id_from_payload(payload)
        if not conv_id:
            logger.error("❌ Webhook ignored: No conversation_id found.")
            return None
        logger.info(f"🤖 Processing Webhook for ElevenLabs ID: {conv_id}")
        return conv_id
    
    @staticmethod
    def check_duplicate(db: Session, conv_id: str) -> bool:
        """Check if conversation has already been processed to prevent duplicates."""
        existing_call = db.query(models.Call).filter(
            models.Call.conversation_id == conv_id
        ).first()
        
        if existing_call:
            logger.info(f"ℹ️ Conversation {conv_id} already processed, skipping duplicate webhook.")
            return True
        return False


class WebhookDataFetchHandler:
    """Handles fetching and parsing data from ElevenLabs API."""

    @staticmethod
    async def fetch_conversation_data_only(conv_id: str) -> Optional[Dict[str, Any]]:
        """Fetch raw conversation data from ElevenLabs API."""
        try:
            data = await fetch_conversation_from_elevenlabs(conv_id)
            return data
        except Exception as e:
            logger.error(f"❌ ElevenLabs API Fetch Failed: {e}")
            return None

    @staticmethod
    async def fetch_and_parse_data(conv_id: str) -> Optional[Tuple[Dict, str, str, str, str, Optional[str], Optional[str], list, Dict[str, Any]]]:
        """Fetch and parse data from ElevenLabs API."""
        data = await WebhookDataFetchHandler.fetch_conversation_data_only(conv_id)
        if data is None:
            return None

        data_dict, intent, phone, summary, name, client_ref_id = extract_conversation_data(data)

        # Extract recording URL from ElevenLabs response
        recording_url = extract_recording_url_from_conversation(data)

        # If no recording URL found in the initial data, try the fallback method
        if not recording_url:
            logger.info(f"🔍 No recording URL in webhook response, trying fallback method for {conv_id}")
            recording_url = await fetch_conversation_recording(conv_id)

        # Extract transcript data for debugging
        transcript_data = extract_transcript_from_conversation(data)
        transcript_count = len(transcript_data) if transcript_data else 0

        # Add more detailed logging to understand the ElevenLabs response structure
        logger.info(f"🔍 Extracted: Intent='{intent}', Phone='{phone}', RefID='{client_ref_id}', Recording URL: {recording_url is not None}, Transcript Entries: {transcript_count}")
        logger.info(f"🔍 ElevenLabs API response keys: {list(data.keys())}")

        # Debug: Log more details about the response for investigation
        if "conversation" in data:
            logger.info(f"🔍 Conversation keys: {list(data['conversation'].keys()) if isinstance(data['conversation'], dict) else 'not a dict'}")
        if "analysis" in data:
            logger.info(f"🔍 Analysis keys: {list(data['analysis'].keys()) if isinstance(data['analysis'], dict) else 'not a dict'}")
        if "metadata" in data:
            logger.info(f"🔍 Metadata keys: {list(data['metadata'].keys()) if isinstance(data['metadata'], dict) else 'not a dict'}")
        if "files" in data:
            logger.info(f"🔍 Files found: {data['files']}")
        if "recording" in data:
            logger.info(f"🔍 Recording found: {data['recording']}")

        # Log whether we have recording and transcript data for debugging
        logger.info(f"📊 Recording data: {recording_url is not None}, Transcript data: {transcript_count > 0}")

        # If no transcript or recording URL, log more details about the structure
        if not transcript_data and not recording_url:
            logger.warning(f"⚠️ No transcript or recording URL found in ElevenLabs response for {conv_id}")
            # Log nested structures to understand the response format
            if 'conversation' in data:
                logger.debug(f"🔍 Conversation data keys: {list(data['conversation'].keys()) if isinstance(data['conversation'], dict) else 'not a dict'}")
            if 'analysis' in data:
                logger.debug(f"🔍 Analysis data keys: {list(data['analysis'].keys()) if isinstance(data['analysis'], dict) else 'not a dict'}")
            if 'metadata' in data:
                logger.debug(f"🔍 Metadata keys: {list(data['metadata'].keys()) if isinstance(data['metadata'], dict) else 'not a dict'}")

        return data_dict, intent, phone, summary, name, client_ref_id, recording_url, transcript_data, data


class WebhookSessionHandler:
    """Handles session discovery and linking."""
    
    @staticmethod
    def discover_session(db: Session, client_ref_id: Optional[str], conv_id: str) -> Optional[models.VoiceSession]:
        """Discover and return the associated session."""
        session = None
        
        if client_ref_id:
            session = db.query(models.VoiceSession).filter(models.VoiceSession.id == client_ref_id).first()
            if session:
                logger.info(f"✅ Linked via Client Ref ID: {session.id}")

        if not session:
            session = db.query(models.VoiceSession).filter(models.VoiceSession.conversation_id == conv_id).first()
            if session:
                logger.info(f"✅ Linked via Conversation ID: {session.id}")
        
        return session


class WebhookCustomerHandler:
    """Handles customer context and recovery."""

    @staticmethod
    def get_or_create_customer(
        db: Session,
        session: Optional[models.VoiceSession],
        phone: str,
        name: str,
        summary: str,
        intent: str,
        client_ref_id: Optional[str],
        conv_id: str,
        data: Dict[str, Any]
    ) -> Tuple[models.Customer, str, Any]:
        """Get or create customer with tenant ID resolution."""
        # CRITICAL: Use the Env Variable default, not hardcoded string
        current_tenant_id = DEFAULT_TENANT_ID

        if session:
            current_tenant_id = session.tenant_id
            # Update session with final data
            session_conversation_id = getattr(session, 'conversation_id', None)
            if session_conversation_id is None:
                session.conversation_id = conv_id
            session.summary = summary
            session.extracted_intent = intent
            session.status = models.VoiceSessionStatus.COMPLETED
            session.ended_at = datetime.now(timezone.utc)
            if phone:
                session.customer_phone = phone

            # Link Customer to Session if not already linked
            customer = upsert_customer(db, phone, name, current_tenant_id)
            if not session.customer_id:
                session.customer_id = customer.id
        else:
            # Ghost Session Handling
            logger.warning(f"👻 Session not found for {conv_id}. Initiating Context Recovery...")

            # Try to find existing customer by phone to recover Tenant ID
            existing_customer = None
            if phone:
                existing_customer = db.query(models.Customer).filter(
                    models.Customer.phone == phone
                ).order_by(models.Customer.created_at.desc()).first()

            if existing_customer:
                current_tenant_id = existing_customer.tenant_id
                logger.info(f"🧬 Context Recovered: Found existing customer {existing_customer.name}, using Tenant: {current_tenant_id}")
                customer = existing_customer
                # Update name if new one is better
                if name and name != "Unknown" and name != customer.name:
                    customer.name = name
                    db.add(customer)
            else:
                # Create new customer in the Default Tenant (from .env)
                logger.info(f"⚠️ No context found. Creating new customer in {current_tenant_id}")
                customer = upsert_customer(db, phone, name, current_tenant_id)

            # Create virtual session object for the logic
            # Use conversation timestamps from ElevenLabs data if available, otherwise use current time
            conversation_start_time = data.get('created_at') or datetime.now(timezone.utc)
            conversation_end_time = data.get('ended_at') or datetime.now(timezone.utc)

            session = SimpleNamespace(
                id=client_ref_id if client_ref_id else f"ghost_{conv_id[:8]}",
                tenant_id=current_tenant_id,
                conversation_id=conv_id,
                summary=summary,
                created_at=conversation_start_time,
                ended_at=conversation_end_time,
                customer_id=customer.id,
                status=models.VoiceSessionStatus.COMPLETED
            )

        return customer, current_tenant_id, session


class WebhookRecordingHandler:
    """Handles recording URL updates to conversation and call records."""
    
    @staticmethod
    def update_recording_urls(db: Session, session: Any, recording_url: Optional[str], transcript_count: int) -> None:
        """Update recording URLs for conversation and call records."""
        if not recording_url or not hasattr(session, 'conversation_id'):
            # Debug logging for transcript data storage (transcript is stored via create_full_interaction_record)
            logger.info(f"📝 Transcript entries processed: {transcript_count} entries for conversation {session.conversation_id if hasattr(session, 'conversation_id') else 'unknown'}")
            return

        # Update Conversation record with recording URL
        conversation_record = db.query(models.Conversation).filter(
            models.Conversation.id == session.conversation_id
        ).first()
        if conversation_record:
            old_recording_url = conversation_record.recording_url
            conversation_record.recording_url = recording_url
            db.add(conversation_record)
            logger.info(f"💾 Conversation recording URL updated: {old_recording_url is None} -> {recording_url is not None} for conversation {session.conversation_id}")

        # Also update the Call record with the same recording URL
        call_record = db.query(models.Call).filter(
            models.Call.conversation_id == session.conversation_id
        ).first()
        if call_record:
            old_call_recording_url = call_record.recording_url
            call_record.recording_url = recording_url
            db.add(call_record)
            logger.info(f"💾 Call recording URL updated: {old_call_recording_url is None} -> {recording_url is not None} for call {call_record.id}")

        # Debug logging for transcript data storage (transcript is stored via create_full_interaction_record)
        logger.info(f"📝 Transcript entries processed: {transcript_count} entries for conversation {session.conversation_id if hasattr(session, 'conversation_id') else 'unknown'}")


class WebhookActionHandler:
    """Handles execution of business actions."""
    
    @staticmethod
    def execute_business_logic(
        db: Session, 
        session: Any, 
        customer: models.Customer, 
        data_dict: Dict[str, Any],
        conv_id: str
    ) -> bool:
        """Execute business logic and update duration."""
        try:
            create_full_interaction_record(db, session, customer, data_dict)

            # Update call duration if conversation data contains timing info
            # Calculate duration from ended_at - created_at and store in handle_sec
            if (hasattr(session, 'ended_at') and 
                hasattr(session, 'created_at') and 
                session.ended_at and 
                session.created_at):
                duration_seconds = (session.ended_at - session.created_at).total_seconds()
                # Update corresponding call record with duration
                if hasattr(session, 'conversation_id'):
                    # Find the call associated with this conversation
                    call_record = db.query(models.Call).filter(
                        models.Call.conversation_id == session.conversation_id
                    ).first()
                    if call_record:
                        call_record.handle_sec = int(duration_seconds)
                        db.add(call_record)

            # Determine if we are committing a real SQLAlchemy object or just the side-effects
            if hasattr(session, "_sa_instance_state"):
                db.add(session)

            db.commit()
            logger.info(f"🚀 SUCCESS: Webhook processed for {customer.name} (Tenant: {session.tenant_id})")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"💥 Critical Failure in Action Service: {e}", exc_info=True)
            return False