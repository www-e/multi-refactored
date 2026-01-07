"""
Twilio Webhook Routes
Handles Twilio call connections and status updates
"""

import logging
import os
from fastapi import APIRouter, Request, Response, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from twilio.twiml.voice_response import VoiceResponse, Dial, Say

from app.api import deps
from app.services.voice import session_service
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()

# Get ElevenLabs phone number from environment
ELEVENLABS_PHONE_NUMBER = os.getenv("ELEVENLABS_PHONE_NUMBER")


@router.post("/twilio/connect/{session_id}")
async def connect_to_elevenlabs(
    session_id: str,
    request: Request,
    db: Session = Depends(deps.get_session)
):
    """
    TwiML endpoint that returns instructions to connect the call to ElevenLabs
    
    When Twilio makes an outbound call and customer answers, it hits this endpoint
    to get instructions on what to do next. We tell it to dial the ElevenLabs phone number.
    """
    logger.info(f"📞 Twilio connect webhook received for session: {session_id}")
    
    # Fetch the voice session to validate it exists
    session = db.query(models.VoiceSession).filter(
        models.VoiceSession.id == session_id
    ).first()
    
    if not session:
        logger.error(f"❌ Voice session not found: {session_id}")
        # Return error TwiML
        response = VoiceResponse()
        response.say("Sorry, there was an error connecting your call. Please try again later.")
        response.hangup()
        return PlainTextResponse(content=str(response), media_type="application/xml")
    
    logger.info(f"✅ Found voice session: {session_id}, agent: {session.agent_name}")
    
    # Create TwiML response to dial ElevenLabs
    response = VoiceResponse()
    
    # Check if ElevenLabs phone number is configured
    if not ELEVENLABS_PHONE_NUMBER:
        logger.error("❌ ELEVENLABS_PHONE_NUMBER not configured")
        response.say("The system is not properly configured. Please contact support.")
        response.hangup()
        return PlainTextResponse(content=str(response), media_type="application/xml")
    
    # Dial the ElevenLabs phone number
    # We pass the session_id as the caller_id to track it
    dial = Dial(
        number=ELEVENLABS_PHONE_NUMBER,
        caller_id=session_id,  # Pass session ID for tracking
        action=f"/api/twilio/dial_status/{session_id}",  # Status callback after dial
        timeout=30,
        hangup_on_star=True
    )
    response.append(dial)
    
    # If dial fails (no answer, etc.)
    response.say("The call could not be connected. Goodbye.")
    response.hangup()
    
    logger.info(f"📞 Returning TwiML to dial ElevenLabs: {ELEVENLABS_PHONE_NUMBER}")
    
    return PlainTextResponse(content=str(response), media_type="application/xml")


@router.post("/twilio/dial_status/{session_id}")
async def dial_status_callback(
    session_id: str,
    request: Request,
    db: Session = Depends(deps.get_session)
):
    """
    Called when the dial to ElevenLabs completes (answered, no-answer, busy, etc.)
    """
    form_data = await request.form()
    dial_call_status = form_data.get("DialCallStatus")
    
    logger.info(f"📞 Dial status for session {session_id}: {dial_call_status}")
    
    # Update session status based on dial result
    session = db.query(models.VoiceSession).filter(
        models.VoiceSession.id == session_id
    ).first()
    
    if session:
        if dial_call_status == "completed":
            session.status = models.VoiceSessionStatus.COMPLETED
            logger.info(f"✅ Session {session_id} completed successfully")
        elif dial_call_status in ["no-answer", "busy", "failed"]:
            session.status = models.VoiceSessionStatus.FAILED
            logger.warning(f"⚠️ Session {session_id} failed: {dial_call_status}")
        
        db.commit()
    
    # Return empty TwiML (call is done)
    response = VoiceResponse()
    response.hangup()
    return PlainTextResponse(content=str(response), media_type="application/xml")


@router.post("/twilio/status/{session_id}")
async def call_status_callback(
    session_id: str,
    request: Request,
    db: Session = Depends(deps.get_session)
):
    """
    Receives status updates from Twilio about the call progress
    
    Events: initiated, ringing, answered, completed, failed, busy, no-answer
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")
    
    logger.info(f"📞 Call status update: SID={call_sid}, Status={call_status}, Session={session_id}")
    
    # Update voice session with call SID and status
    session = db.query(models.VoiceSession).filter(
        models.VoiceSession.id == session_id
    ).first()
    
    if session:
        # Store Twilio call SID
        if not hasattr(session, 'twilio_call_sid'):
            session.twilio_call_sid = call_sid
        
        # Update status based on call progress
        if call_status == "ringing":
            session.status = models.VoiceSessionStatus.ACTIVE
            logger.info(f"📞 Phone ringing for session {session_id}")
        
        elif call_status == "answered":
            session.status = models.VoiceSessionStatus.ACTIVE
            logger.info(f"✅ Call answered for session {session_id}")
        
        elif call_status == "completed":
            # Will be updated to COMPLETED when ElevenLabs webhook arrives
            logger.info(f"✅ Call completed for session {session_id}")
        
        elif call_status in ["failed", "busy", "no-answer"]:
            session.status = models.VoiceSessionStatus.FAILED
            logger.warning(f"⚠️ Call failed for session {session_id}: {call_status}")
        
        db.commit()
    
    # Return 200 OK to Twilio
    return {"status": "received"}


@router.post("/twilio/test")
async def test_twilio_webhook():
    """
    Test endpoint to verify TwiML generation
    """
    response = VoiceResponse()
    response.say("Hello, this is a test call from the system.")
    response.hangup()
    return PlainTextResponse(content=str(response), media_type="application/xml")


@router.get("/twilio/health")
async def twilio_health_check():
    """
    Health check endpoint for Twilio configuration
    """
    return {
        "status": "ok",
        "elevenlabs_number_configured": bool(ELEVENLABS_PHONE_NUMBER),
        "elevenlabs_number": ELEVENLABS_PHONE_NUMBER if ELEVENLABS_PHONE_NUMBER else "Not configured"
    }
