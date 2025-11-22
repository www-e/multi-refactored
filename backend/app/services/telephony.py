"""
Telephony service for making outbound calls
This service handles the actual calling functionality, interfacing with telephony providers like Twilio
"""
import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TelephonyService:
    """
    Service to handle outbound calls using various telephony providers
    """
    
    def __init__(self):
        # Initialize with environment variables
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # For demo purposes, we'll also support a mock provider
        self.mock_mode = os.getenv("TELEPHONY_MOCK", "false").lower() == "true"
        
        # Validate required credentials
        if not self.mock_mode:
            if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone_number]):
                logger.warning("Twilio credentials not fully configured. Using mock mode.")
                self.mock_mode = True

    async def make_call(self, to_number: str, from_number: Optional[str] = None, 
                       message: Optional[str] = None, voice_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Make an outbound call to the specified number
        
        Args:
            to_number: The phone number to call
            from_number: The phone number to use as caller ID (optional, uses default if not provided)
            message: A text message to be read in the call (for text-to-speech)
            voice_url: A URL to a TwiML application or webhook for call handling
        
        Returns:
            Dict containing call details including call SID and status
        """
        if self.mock_mode:
            # Mock implementation for development
            logger.info(f"Mock call initiated to: {to_number}")
            return {
                "call_sid": f"mock_call_{to_number}",
                "status": "queued",  # Twilio-style status
                "to_number": to_number,
                "from_number": from_number or self.twilio_phone_number,
                "mock": True
            }
        else:
            try:
                # Import Twilio only when needed and credentials are available
                from twilio.rest import Client
                
                client = Client(self.twilio_account_sid, self.twilio_auth_token)
                
                # Determine the from number
                use_from_number = from_number or self.twilio_phone_number
                
                call_kwargs = {
                    "to": to_number,
                    "from_": use_from_number,
                }
                
                if voice_url:
                    # Use the voice URL for call handling
                    call_kwargs["url"] = voice_url
                elif message:
                    # Use text-to-speech with the provided message
                    from twilio.twiml import VoiceResponse
                    response = VoiceResponse()
                    response.say(message=message, voice='alice', language='ar-SA')
                    # For now, just use a simple URL that returns this response
                    # In a real implementation, you'd host a TwiML endpoint
                    call_kwargs["url"] = "http://demo.twilio.com/docs/voice.xml"
                else:
                    # Default behavior - use a simple TwiML endpoint
                    call_kwargs["url"] = "http://demo.twilio.com/docs/voice.xml"
                
                call = client.calls.create(**call_kwargs)
                
                return {
                    "call_sid": call.sid,
                    "status": call.status,
                    "to_number": to_number,
                    "from_number": call.from_,
                    "mock": False
                }
                
            except ImportError:
                logger.error("Twilio library not installed. Install with: pip install twilio")
                raise Exception("Twilio library not available")
            except Exception as e:
                logger.error(f"Error making call: {str(e)}")
                raise e

    async def send_sms(self, to_number: str, message: str, from_number: Optional[str] = None) -> Dict[str, Any]:
        """
        Send an SMS message to the specified number
        
        Args:
            to_number: The phone number to send message to
            message: The message content
            from_number: The phone number to use as sender (optional)
        
        Returns:
            Dict containing message details including message SID and status
        """
        if self.mock_mode:
            logger.info(f"Mock SMS sent to: {to_number}, message: {message}")
            return {
                "message_sid": f"mock_sms_{to_number}",
                "status": "sent",
                "to_number": to_number,
                "from_number": from_number or self.twilio_phone_number,
                "mock": True
            }
        else:
            try:
                from twilio.rest import Client
                
                client = Client(self.twilio_account_sid, self.twilio_auth_token)
                
                use_from_number = from_number or self.twilio_phone_number
                
                message = client.messages.create(
                    body=message,
                    from_=use_from_number,
                    to=to_number
                )
                
                return {
                    "message_sid": message.sid,
                    "status": message.status,
                    "to_number": to_number,
                    "from_number": message.from_,
                    "mock": False
                }
                
            except ImportError:
                logger.error("Twilio library not installed. Install with: pip install twilio")
                raise Exception("Twilio library not available")
            except Exception as e:
                logger.error(f"Error sending SMS: {str(e)}")
                raise e

    async def make_bulk_calls(self, phone_numbers: list[str], message: Optional[str] = None) -> Dict[str, Any]:
        """
        Make multiple calls simultaneously
        
        Args:
            phone_numbers: List of phone numbers to call
            message: Message to read in the calls (optional)
        
        Returns:
            Dict containing results of the bulk operation
        """
        results = []
        errors = []
        
        for number in phone_numbers:
            try:
                result = await self.make_call(number, message=message)
                results.append(result)
            except Exception as e:
                errors.append(f"Failed to call {number}: {str(e)}")
        
        return {
            "successful_calls": len(results),
            "failed_calls": len(errors),
            "results": results,
            "errors": errors
        }

# Singleton instance
telephony_service = TelephonyService()