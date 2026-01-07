"""
Twilio Service Module
Handles outbound call initiation and management using Twilio API
"""

import logging
import os
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)


class TwilioService:
    """
    Service for interacting with Twilio API to make outbound calls
    """
    
    def __init__(self):
        """Initialize Twilio client with environment variables"""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # Validate configuration
        if not all([self.account_sid, self.auth_token, self.from_number]):
            logger.warning("⚠️ Twilio credentials not fully configured. Outbound calls will not work.")
            self.client = None
        else:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                logger.info(f"✅ Twilio service initialized with number: {self.from_number}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Twilio client: {e}")
                self.client = None
    
    def is_configured(self) -> bool:
        """Check if Twilio is properly configured"""
        return self.client is not None
    
    def initiate_outbound_call(
        self,
        to_phone: str,
        session_id: str,
        webhook_url: str,
        agent_type: str = "support"
    ) -> Dict[str, Any]:
        """
        Initiate an outbound call to a customer
        
        Args:
            to_phone: Customer phone number (E.164 format preferred)
            session_id: VoiceSession ID for tracking
            webhook_url: Base URL for Twilio webhooks
            agent_type: Type of agent (support/sales)
            
        Returns:
            Dict with call_sid and status
            
        Raises:
            ValueError: If Twilio not configured
            TwilioRestException: If call initiation fails
        """
        if not self.is_configured():
            raise ValueError(
                "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, "
                "TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables."
            )
        
        try:
            # Normalize phone number to E.164 format if needed
            normalized_phone = self._normalize_phone_number(to_phone)
            
            # Create the call
            logger.info(f"📞 Initiating outbound call to {normalized_phone} (session: {session_id})")
            
            call = self.client.calls.create(
                to=normalized_phone,
                from_=self.from_number,
                url=f"{webhook_url}/api/twilio/connect/{session_id}",
                status_callback=f"{webhook_url}/api/twilio/status/{session_id}",
                status_callback_event=['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no-answer'],
                status_callback_method='POST',
                machine_detection='DetectMessageEnd'
            )
            
            logger.info(f"✅ Call initiated successfully. SID: {call.sid}, Status: {call.status}")
            
            return {
                "call_sid": call.sid,
                "status": call.status,
                "to": normalized_phone,
                "from": self.from_number,
                "session_id": session_id
            }
            
        except TwilioRestException as e:
            logger.error(f"❌ Twilio API error: {e.msg} (code: {e.code})")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error initiating call: {e}")
            raise
    
    def get_call_status(self, call_sid: str) -> Optional[Dict[str, Any]]:
        """
        Get the current status of a call
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            Dict with call status information or None
        """
        if not self.is_configured():
            return None
        
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "sid": call.sid,
                "status": call.status,
                "direction": call.direction,
                "duration": call.duration,
                "to": call.to,
                "from": call.from_
            }
        except Exception as e:
            logger.error(f"❌ Error fetching call status: {e}")
            return None
    
    def _normalize_phone_number(self, phone: str) -> str:
        """
        Normalize phone number to E.164 format
        
        Args:
            phone: Phone number in various formats
            
        Returns:
            Phone number in E.164 format
        """
        # Remove spaces, dashes, parentheses
        cleaned = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # If starts with +, assume E.164
        if cleaned.startswith('+'):
            return cleaned
        
        # If starts with 1 and is 11 digits (US format)
        if cleaned.startswith('1') and len(cleaned) == 11:
            return f"+{cleaned}"
        
        # If 10 digits, assume US (add +1)
        if len(cleaned) == 10 and cleaned.isdigit():
            return f"+1{cleaned}"
        
        # If has country code but no +
        if len(cleaned) > 10 and cleaned.isdigit():
            return f"+{cleaned}"
        
        # Return original if can't normalize
        logger.warning(f"⚠️ Could not normalize phone number: {phone}")
        return phone
    
    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate if phone number looks reasonable
        
        Args:
            phone: Phone number to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            normalized = self._normalize_phone_number(phone)
            # Check if it's in E.164 format (starts with + and has 10-15 digits)
            if normalized.startswith('+') and 10 <= len(normalized) <= 16:
                return True
            return False
        except:
            return False


# Singleton instance
_twilio_service_instance = None

def get_twilio_service() -> TwilioService:
    """Get or create the singleton TwilioService instance"""
    global _twilio_service_instance
    if _twilio_service_instance is None:
        _twilio_service_instance = TwilioService()
    return _twilio_service_instance
