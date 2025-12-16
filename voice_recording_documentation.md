# Voice Call Recording Management Documentation

This document outlines all files and components involved in voice call recording functionality, including saving, creating, retrieving, and storing recording URLs.

## Database Models

### `app/models.py`
- **Conversation model**: Contains `recording_url` field (String, nullable=True)
- **Call model**: Contains `recording_url` field (String, nullable=True) - Foreign Key to conversations table

## API Routes

### `app/api/routes/calls.py`
- **GET /calls**: Retrieves calls with recording URLs, joins with voice sessions to get recording URLs from either source
- **GET /calls/{call_id}**: Retrieves specific call details including recording URL from either call or voice session
- **Response models**: Include recording_url field in CallResponse models

### `app/api/routes/conversations.py`
- **GET /conversations/{conversation_id}**: Retrieves conversation details including recording_url

### `app/api/routes/voice.py`
- **POST /voice/post_call**: Webhook endpoint that processes ElevenLabs webhooks and saves recording URLs
- **POST /elevenlabs/conversation/{conversation_id}/process**: Manual sync endpoint that processes conversation data including recordings

## Service Layer

### `app/services/voice/elevenlabs_service.py`
- **extract_recording_url_from_conversation()**: Comprehensive function to find recording URLs in ElevenLabs API response
- **fetch_conversation_from_elevenlabs()**: Fetches conversation data including possible recording information
- **Uses extensive search patterns** to find recording URLs in various possible locations:
  - Top-level fields: recording_url, audio_url, download_url, playback_url, etc.
  - Nested in metadata, analysis, conversation sections
  - In conversation turns
  - By conversation ID matching
  - By file extensions (.mp3, .wav, .m4a, etc.)
  - Recursive searches through nested structures

### `app/services/voice/webhook_handlers.py`
- **WebhookRecordingHandler**: Class that handles recording URL updates to database
- **update_recording_urls()**: Updates both conversation and call records with recording URLs
- Properly updates both Conversation and Call models with same recording URL

### `app/services/voice/webhook_service.py`
- **process_webhook_payload()**: Main function that orchestrates webhook processing including recording URL handling
- Uses WebhookRecordingHandler to update recording URLs in database

## Migration Files

### `alembic/versions/c1c3c5a1c065_create_initial_database_schema.py`
- Database migration that creates recording_url columns in both conversations and calls tables

## API Response Models

### `app/api/routes/calls.py`
- **CallResponse**: Model that includes recording_url field
- **CallDetailsResponse**: Model that includes recording_url field

### `app/api/routes/conversations.py`
- **ConversationResponse**: Model that includes recording_url field

## Frontend Integration

The frontend expects recording_url to be available in the API responses from calls and conversations endpoints. If recording_url is None or empty, the frontend displays "لا توجد تسجيلات متاحة (URL فارغة)" which means "No recordings available (Empty URL)".

## Current Issue

The ElevenLabs webhook payload does not include direct recording URLs in the response, even though it indicates `has_audio=true`, `has_user_audio=true`, and `has_response_audio=true`. This suggests either:

1. The recording download feature is not enabled in the ElevenLabs agent configuration
2. Recordings need to be retrieved from a different API endpoint
3. The recording format or availability settings in ElevenLabs need adjustment

## Data Flow

1. ElevenLabs sends webhook to `/voice/post_call`
2. Webhook payload is processed by `process_webhook_payload()`
3. `extract_recording_url_from_conversation()` searches for recording URLs
4. If found, `WebhookRecordingHandler.update_recording_urls()` updates both conversation and call records
5. API endpoints (`/calls`, `/calls/{id}`) return recording URLs to frontend
6. Frontend displays audio player if recording URL exists, error message if not

## Potential Enhancement

To improve recording availability, consider implementing a separate API call to retrieve recordings using a potential endpoint like `/v1/convai/conversations/{conversation_id}/recording` if such functionality is available in ElevenLabs API.