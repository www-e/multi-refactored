"""
Voice Service Package
Exposes the core functionality for ElevenLabs integration,
Session management, and Action execution (Bookings/Tickets).
"""

from .session_service import (
    create_voice_session,
    get_voice_session
)

from .customer_service import (
    upsert_customer,
    normalize_phone_number
)

from .action_service import (
    create_full_interaction_record
)

from .elevenlabs_service import (
    get_elevenlabs_headers,
    verify_elevenlabs_webhook_signature,
    fetch_conversation_from_elevenlabs,
    fetch_conversation_recording,
    extract_conversation_data,
    extract_conversation_id_from_payload
)

from .webhook_service import (
    process_webhook_payload
)

from .webhook_handlers import (
    WebhookValidationHandler,
    WebhookDataFetchHandler,
    WebhookSessionHandler,
    WebhookCustomerHandler,
    WebhookRecordingHandler,
    WebhookActionHandler
)

__all__ = [
    # Session Management
    "create_voice_session",
    "get_voice_session",

    # Customer Management
    "upsert_customer",
    "normalize_phone_number",

    # Business Logic / Actions
    "create_full_interaction_record",

    # ElevenLabs Helpers
    "get_elevenlabs_headers",
    "verify_elevenlabs_webhook_signature",
    "fetch_conversation_from_elevenlabs",
    "fetch_conversation_recording",
    "extract_conversation_data",
    "extract_conversation_id_from_payload",

    # Webhook Orchestrator
    "process_webhook_payload",

    # Webhook Handlers
    "WebhookValidationHandler",
    "WebhookDataFetchHandler",
    "WebhookSessionHandler",
    "WebhookCustomerHandler",
    "WebhookRecordingHandler",
    "WebhookActionHandler"
]