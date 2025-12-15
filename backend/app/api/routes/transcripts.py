import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any
from app.api import deps
from app.services.voice.elevenlabs_service import (
    fetch_conversation_from_elevenlabs,
    extract_transcript_from_conversation,
    check_transcript_availability
)

logger = logging.getLogger(__name__)
router = APIRouter()

class TranscriptResponse(BaseModel):
    conversation_id: str
    transcript: List[dict]
    summary: Optional[str] = None
    extracted_intent: Optional[Union[str, Dict[str, Any]]] = None
    is_available: bool = True

@router.get("/transcripts/{conversation_id}", response_model=TranscriptResponse)
async def get_transcript(
    conversation_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve transcript for a specific conversation from ElevenLabs
    """
    logger.info(f"🔄 Transcript request received for conversation: {conversation_id}")
    try:
        # Fetch conversation data from ElevenLabs
        elevenlabs_data = await fetch_conversation_from_elevenlabs(conversation_id)

        # Extract transcript (the availability check might be too restrictive)
        transcript = extract_transcript_from_conversation(elevenlabs_data)
        transcript_length = len(transcript)
        is_available = transcript_length > 0  # Update availability based on actual extracted data

        logger.info(f"📋 Transcript data: Available={is_available}, Entries={transcript_length} for conversation {conversation_id}")

        # Get summary and intent from analysis
        analysis = elevenlabs_data.get("analysis", {})
        summary = analysis.get("transcript_summary") or analysis.get("call_summary_title")

        # Handle extracted_intent which may be a string or dict
        raw_intent = analysis.get("data_collection_results", {}).get("extracted_intent")
        if isinstance(raw_intent, dict):
            # Extract the value from dict if it's a complex object
            extracted_intent = raw_intent.get("value") or raw_intent
        else:
            extracted_intent = raw_intent

        response = TranscriptResponse(
            conversation_id=conversation_id,
            transcript=transcript,
            summary=summary,
            extracted_intent=extracted_intent,
            is_available=is_available
        )

        logger.info(f"✅ Transcript response prepared: {transcript_length} entries, available={is_available} for conversation {conversation_id}")
        return response
    except HTTPException:
        logger.warning(f"⚠️ HTTP exception for transcript {conversation_id}: {str(HTTPException)}")
        # Re-raise HTTP exceptions (like 404 from ElevenLabs API) directly
        raise
    except Exception as e:
        logger.error(f"❌ Failed to retrieve transcript for conversation {conversation_id}: {e}")
        # Provide more specific error handling based on the type of error
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            logger.info(f"📝 Transcript not found for conversation {conversation_id}")
            raise HTTPException(status_code=404, detail="Transcript not available for this conversation")
        else:
            logger.error(f"❌ Transcript retrieval error for {conversation_id}: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve transcript: {error_msg}")

@router.get("/transcripts/{conversation_id}/text")
async def get_transcript_text(
    conversation_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve transcript as plain text format
    """
    try:
        # Fetch conversation data from ElevenLabs
        elevenlabs_data = await fetch_conversation_from_elevenlabs(conversation_id)

        # Extract transcript (don't rely solely on availability check)
        transcript = extract_transcript_from_conversation(elevenlabs_data)
        is_available = len(transcript) > 0

        if not is_available:
            return {"text": "", "is_available": False}

        # Format as plain text
        text_lines = []
        for entry in transcript:
            role = "العميل" if entry.get("role") == "user" else "الوكيل"
            text_lines.append(f"[{entry.get('timestamp', 0)}s] {role}: {entry.get('text', '')}")

        return {"text": "\n".join(text_lines), "is_available": True}
    except HTTPException:
        # Re-raise HTTP exceptions (like 404 from ElevenLabs API) directly
        raise
    except Exception as e:
        logger.error(f"❌ Failed to retrieve transcript text for conversation {conversation_id}: {e}")
        # Provide more specific error handling based on the type of error
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail="Transcript not available for this conversation")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve transcript: {error_msg}")