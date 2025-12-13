from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel

from app import models
from app.api import deps

router = APIRouter()

class MessageCreateRequest(BaseModel):
    conversation_id: str
    role: str  # 'user' or 'assistant'
    text: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: str
    role: str
    text: str
    ts: datetime

@router.post("/messages", response_model=MessageResponse)
def create_message(
    msg_in: MessageCreateRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Create a new message in a conversation.
    """
    # Verify conversation exists and belongs to tenant
    conversation = db_session.query(models.Conversation).filter(
        models.Conversation.id == msg_in.conversation_id,
        models.Conversation.tenant_id == tenant_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Create message record
    db_message = models.Message(
        conversation_id=msg_in.conversation_id,
        role=msg_in.role,
        text=msg_in.text,
        ts=datetime.now(timezone.utc)
    )
    db_session.add(db_message)
    db_session.commit()
    db_session.refresh(db_message)

    return MessageResponse(
        id=db_message.id,
        conversation_id=db_message.conversation_id,
        role=db_message.role,
        text=db_message.text,
        ts=db_message.ts
    )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve all messages for a specific conversation.
    """
    # Verify conversation exists and belongs to tenant
    conversation = db_session.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.tenant_id == tenant_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get messages for the conversation
    messages = db_session.query(models.Message)\
        .filter(models.Message.conversation_id == conversation_id)\
        .order_by(models.Message.ts)\
        .offset(skip)\
        .limit(limit)\
        .all()

    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            role=msg.role,
            text=msg.text,
            ts=msg.ts
        )
        for msg in messages
    ]

@router.get("/messages", response_model=List[MessageResponse])
def get_messages(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    conversation_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve messages, optionally filtered by conversation.
    """
    query = db_session.query(models.Message)

    # Filter by tenant through conversation
    query = query.join(models.Conversation).filter(models.Conversation.tenant_id == tenant_id)

    if conversation_id:
        query = query.filter(models.Message.conversation_id == conversation_id)

    messages = query.order_by(models.Message.ts.desc()).offset(skip).limit(limit).all()

    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            role=msg.role,
            text=msg.text,
            ts=msg.ts
        )
        for msg in messages
    ]