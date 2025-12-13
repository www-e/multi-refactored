from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging

from app.api import deps
from app.services.voice.elevenlabs_service import send_text_to_elevenlabs_agent

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    agentType: str  # 'support' or 'sales'
    conversationHistory: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _ = Depends(deps.get_current_user)
):
    """
    Chat endpoint that connects to ElevenLabs for AI responses
    """
    try:
        # Validate required fields
        if not chat_request.message or not chat_request.agentType:
            raise HTTPException(status_code=400, detail="Message and agentType are required")
        
        # Validate agent type
        if chat_request.agentType not in ['support', 'sales']:
            raise HTTPException(status_code=400, detail="agentType must be 'support' or 'sales'")
        
        # Get AI response from ElevenLabs
        ai_response = await send_text_to_elevenlabs_agent(
            message=chat_request.message,
            agent_type=chat_request.agentType
        )
        
        return ChatResponse(response=ai_response)
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error processing chat")