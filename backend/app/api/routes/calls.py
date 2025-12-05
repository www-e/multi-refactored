import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import asyncio

from app import models, schemas
from app.api import deps
from app.services.telephony import telephony_service

logger = logging.getLogger(__name__)

router = APIRouter()

def generate_id(prefix: str = "call") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class CallCreateRequest(BaseModel):
    customer_id: str
    phone: str
    direction: str = "outbound"  # Default to outbound
    agent_type: str = "human"    # Can be 'human' or 'ai'
    campaign_id: Optional[str] = None

class CallResponse(BaseModel):
    id: str
    conversation_id: str
    customer_id: str
    direction: str
    status: str
    handle_sec: Optional[int] = None
    outcome: Optional[str] = None
    ai_or_human: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime

@router.post("/calls", response_model=CallResponse)
async def create_call(
    call_in: CallCreateRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Create a new call record. This endpoint initiates an outbound call.
    """
    # Verify customer exists and belongs to tenant
    customer = db_session.query(models.Customer).filter(
        models.Customer.id == call_in.customer_id,
        models.Customer.tenant_id == tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # In the current model, calls are linked to conversations, not directly to customers
    # We'll create a conversation first, then link the call to it
    conversation = models.Conversation(
        id=generate_id("conv"),
        tenant_id=tenant_id,
        channel=models.ChannelEnum.voice,
        customer_id=call_in.customer_id,
        summary=f"Outbound call to {call_in.phone}",
        sentiment="neutral",
        ai_or_human=models.AIOrHumanEnum.Human if call_in.agent_type == "human" else models.AIOrHumanEnum.AI,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(conversation)
    db_session.flush()  # Get the ID without committing

    # Create call record linked to the conversation
    db_call = models.Call(
        id=generate_id(),
        tenant_id=tenant_id,  # Include tenant_id for proper isolation
        conversation_id=conversation.id,  # Link to conversation
        direction=call_in.direction,
        status="initiated",  # Initial status
        created_at=datetime.now(timezone.utc),
        handle_sec=None,
        outcome=None,
        ai_or_human=models.AIOrHumanEnum.Human if call_in.agent_type == "human" else models.AIOrHumanEnum.AI,
        recording_url=None
    )
    db_session.add(db_call)
    db_session.commit()
    db_session.refresh(db_call)

    try:
        # Actually initiate the outbound call via telephony service
        call_result = await telephony_service.make_call(
            to_number=call_in.phone,
            message="This is a test call from Agentic Navaia. Please hold while we connect you to an agent."
        )

        # Update call status based on result
        if call_result.get("status") in ["queued", "in-progress", "ringing"]:
            db_call.status = "connected"
        else:
            db_call.status = "failed"

        db_session.commit()
        db_session.refresh(db_call)

    except Exception as e:
        # If the call fails to initiate, update status but still return the record
        db_call.status = "failed"
        db_session.commit()
        logger.error(f"Failed to initiate call: {str(e)}")

    return CallResponse(
        id=db_call.id,
        conversation_id=db_call.conversation_id,
        customer_id=call_in.customer_id,  # Use the customer_id from the request
        direction=db_call.direction,
        status=db_call.status,
        handle_sec=db_call.handle_sec,
        outcome=db_call.outcome,
        ai_or_human=db_call.ai_or_human,
        recording_url=db_call.recording_url,
        created_at=db_call.created_at
    )

@router.get("/calls", response_model=List[CallResponse])
def get_calls(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a list of calls.
    """
    # Join Call with Conversation to get customer_id efficiently, with tenant filtering
    call_data = db_session.query(models.Call, models.Conversation.customer_id).join(
        models.Conversation, models.Call.conversation_id == models.Conversation.id
    ).filter(
        models.Conversation.tenant_id == tenant_id  # Filter by tenant via conversation
    ).offset(skip).limit(limit).all()

    # Convert to response format
    return [
        CallResponse(
            id=call.id,
            conversation_id=call.conversation_id,
            customer_id=customer_id,
            direction=call.direction,
            status=call.status,
            handle_sec=call.handle_sec,
            outcome=call.outcome,
            ai_or_human=call.ai_or_human,
            recording_url=call.recording_url,
            created_at=call.created_at
        )
        for call, customer_id in call_data
    ]

@router.get("/calls/{call_id}", response_model=CallResponse)
def get_call(
    call_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a specific call by ID.
    """
    call_with_customer = db_session.query(models.Call, models.Conversation.customer_id).join(
        models.Conversation, models.Call.conversation_id == models.Conversation.id
    ).filter(
        models.Call.id == call_id,
        models.Conversation.tenant_id == tenant_id  # Filter by tenant through conversation
    ).first()

    if not call_with_customer:
        raise HTTPException(status_code=404, detail="Call not found")

    call, customer_id = call_with_customer

    return CallResponse(
        id=call.id,
        conversation_id=call.conversation_id,
        customer_id=customer_id,
        direction=call.direction,
        status=call.status,
        handle_sec=call.handle_sec,
        outcome=call.outcome,
        ai_or_human=call.ai_or_human,
        recording_url=call.recording_url,
        created_at=call.created_at
    )

@router.post("/calls/bulk")
async def create_bulk_calls(
    customer_ids: List[str],
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Create multiple calls for bulk calling functionality.
    """
    created_calls = []
    errors = []

    for customer_id in customer_ids:
        # Verify customer exists AND belongs to the current tenant
        customer = db_session.query(models.Customer).filter(
            models.Customer.id == customer_id,
            models.Customer.tenant_id == tenant_id
        ).first()
        if not customer:
            errors.append(f"Customer {customer_id} not found in tenant or doesn't exist")
            continue

        # Create conversation first
        conversation = models.Conversation(
            id=generate_id("conv"),
            tenant_id=tenant_id,  # Use the actual tenant_id instead of hardcoded "demo-tenant"
            channel=models.ChannelEnum.voice,
            customer_id=customer_id,
            summary=f"Outbound call to {customer.phone}",
            sentiment="neutral",
            ai_or_human=models.AIOrHumanEnum.Human,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(conversation)
        db_session.flush()  # Get the ID without committing

        # Create call record
        db_call = models.Call(
            id=generate_id(),
            tenant_id=tenant_id,  # Include tenant_id for proper isolation
            conversation_id=conversation.id,
            direction="outbound",
            status="initiated",
            created_at=datetime.now(timezone.utc),
            handle_sec=None,
            outcome=None,
            ai_or_human=models.AIOrHumanEnum.Human
        )
        db_session.add(db_call)
        created_calls.append(db_call)

    db_session.commit()

    # Now initiate the actual calls via telephony service
    phone_numbers = [db_session.query(models.Customer).filter(
        models.Customer.id == cid,
        models.Customer.tenant_id == tenant_id
    ).first().phone for cid in customer_ids if db_session.query(models.Customer).filter(
        models.Customer.id == cid,
        models.Customer.tenant_id == tenant_id
    ).first()]

    try:
        bulk_result = await telephony_service.make_bulk_calls(
            phone_numbers=phone_numbers,
            message="This is a bulk call from Agentic Navaia. Please hold while we connect you to an agent."
        )

        # Return bulk call results
        return {
            "created_calls": len(created_calls),
            "initiated_calls": bulk_result.get("successful_calls", 0),
            "failed_calls": bulk_result.get("failed_calls", 0),
            "errors": errors + bulk_result.get("errors", [])
        }
    except Exception as e:
        logger.error(f"Failed to initiate bulk calls: {str(e)}")
        return {
            "created_calls": len(created_calls),
            "initiated_calls": 0,
            "failed_calls": len(phone_numbers),
            "errors": errors + [f"Failed to initiate bulk calls: {str(e)}"]
        }