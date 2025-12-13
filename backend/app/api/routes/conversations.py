from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app import models
from app.api import deps

router = APIRouter()

def generate_id(prefix: str = "conv") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class MessageInConversation(BaseModel):
    id: int
    role: str
    text: str
    ts: datetime

class ConversationCreateRequest(BaseModel):
    customer_id: str
    channel: str = "chat"  # Default to chat
    summary: str = ""

class ConversationResponse(BaseModel):
    id: str
    customer_id: str
    channel: str
    summary: str
    created_at: datetime
    transcript: Optional[List[MessageInConversation]] = []

class ConversationDetailResponse(ConversationResponse):
    transcript: List[MessageInConversation]
    recording_url: Optional[str] = None

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conv_in: ConversationCreateRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Create a new conversation record.
    """
    # Verify customer exists and belongs to tenant
    customer = db_session.query(models.Customer).filter(
        models.Customer.id == conv_in.customer_id,
        models.Customer.tenant_id == tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Create conversation record
    db_conv = models.Conversation(
        id=generate_id(),
        tenant_id=tenant_id,
        customer_id=conv_in.customer_id,
        channel=conv_in.channel,
        summary=conv_in.summary,
        sentiment="neutral",
        ai_or_human=models.AIOrHumanEnum.Human,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(db_conv)
    db_session.commit()
    db_session.refresh(db_conv)

    return ConversationResponse(
        id=db_conv.id,
        customer_id=db_conv.customer_id,
        channel=db_conv.channel.value if hasattr(db_conv.channel, 'value') else db_conv.channel,
        summary=db_conv.summary,
        created_at=db_conv.created_at,
        transcript=[]
    )

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    customer_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a list of conversations.
    """
    query = db_session.query(models.Conversation).filter(models.Conversation.tenant_id == tenant_id)

    if customer_id:
        query = query.filter(models.Conversation.customer_id == customer_id)

    conversations = query.offset(skip).limit(limit).all()

    # Convert to response format
    result = []
    for conv in conversations:
        # Get the latest messages for summary (without full transcript for performance)
        messages = db_session.query(models.Message)\
            .filter(models.Message.conversation_id == conv.id)\
            .order_by(models.Message.ts.desc())\
            .limit(5)\
            .all()

        transcript = [
            MessageInConversation(
                id=msg.id,
                role=msg.role,
                text=msg.text,
                ts=msg.ts
            )
            for msg in messages
        ]

        result.append(
            ConversationResponse(
                id=conv.id,
                customer_id=conv.customer_id,
                channel=conv.channel.value if hasattr(conv.channel, 'value') else conv.channel,
                summary=conv.summary,
                created_at=conv.created_at,
                transcript=transcript
            )
        )

    return result

@router.get("/conversations/{conv_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conv_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a specific conversation by ID with full transcript.
    """
    conversation = db_session.query(models.Conversation).filter(
        models.Conversation.id == conv_id,
        models.Conversation.tenant_id == tenant_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get all messages for this conversation
    messages = db_session.query(models.Message)\
        .filter(models.Message.conversation_id == conv_id)\
        .order_by(models.Message.ts)\
        .all()

    transcript = [
        MessageInConversation(
            id=msg.id,
            role=msg.role,
            text=msg.text,
            ts=msg.ts
        )
        for msg in messages
    ]

    return ConversationDetailResponse(
        id=conversation.id,
        customer_id=conversation.customer_id,
        channel=conversation.channel.value if hasattr(conversation.channel, 'value') else conversation.channel,
        summary=conversation.summary,
        created_at=conversation.created_at,
        transcript=transcript,
        recording_url=conversation.recording_url
    )