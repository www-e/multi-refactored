import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app import models
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()

def generate_id(prefix: str = "call") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class CallCreateRequest(BaseModel):
    customer_id: str
    phone: str
    direction: str = "outbound"
    agent_type: str = "human"

class BulkCallRequest(BaseModel):
    customer_ids: List[str]

class CallResponse(BaseModel):
    id: str
    conversation_id: str
    customer_id: Optional[str]
    direction: str
    status: str
    outcome: Optional[str]
    created_at: datetime
    handle_sec: Optional[int] = None
    recording_url: Optional[str] = None
    # Voice Session fields
    voice_session_id: Optional[str] = None
    extracted_intent: Optional[str] = None
    summary: Optional[str] = None
    agent_name: Optional[str] = None
    session_status: Optional[str] = None

@router.post("/calls", response_model=CallResponse)
async def create_call(
    call_in: CallCreateRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    # Real DB Logic
    conv_id = f"conv_{generate_id()[5:]}"

    # 1. Create Conversation Container
    conversation = models.Conversation(
        id=conv_id,
        tenant_id=tenant_id,
        channel=models.ChannelEnum.voice,
        customer_id=call_in.customer_id,
        summary="Outbound Call Initiated",
        ai_or_human=models.AIOrHumanEnum.Human if call_in.agent_type == "human" else models.AIOrHumanEnum.AI,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(conversation)
    db_session.flush()

    # 2. Create Call Record
    db_call = models.Call(
        id=generate_id(),
        tenant_id=tenant_id,
        conversation_id=conversation.id,
        direction=call_in.direction,
        status="connected",
        created_at=datetime.now(timezone.utc),
        ai_or_human=models.AIOrHumanEnum.Human if call_in.agent_type == "human" else models.AIOrHumanEnum.AI
    )
    db_session.add(db_call)
    db_session.commit()
    db_session.refresh(db_call)

    return CallResponse(
        id=db_call.id,
        conversation_id=db_call.conversation_id,
        customer_id=call_in.customer_id,
        direction=db_call.direction.value,
        status=db_call.status.value,
        outcome=None,
        created_at=db_call.created_at,
        handle_sec=db_call.handle_sec,
        recording_url=db_call.recording_url,
        voice_session_id=None,
        extracted_intent=None,
        summary=None,
        agent_name=None,
        session_status=None
    )

@router.post("/calls/bulk")
async def create_bulk_calls(
    body: BulkCallRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    # ACTUAL Implementation: Iterate and Create Records
    created_count = 0
    for cust_id in body.customer_ids:
        customer = db_session.query(models.Customer).filter(models.Customer.id == cust_id).first()
        if not customer: continue

        # Create Conversation
        conv = models.Conversation(
            id=f"conv_{generate_id()[5:]}",
            tenant_id=tenant_id,
            channel=models.ChannelEnum.voice,
            customer_id=cust_id,
            summary="Bulk Outbound Campaign",
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(conv)
        db_session.flush()

        # Create Call
        call = models.Call(
            id=generate_id(),
            tenant_id=tenant_id,
            conversation_id=conv.id,
            direction="outbound",
            status="connected", # Simulating immediate connection
            ai_or_human=models.AIOrHumanEnum.AI,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(call)
        created_count += 1

    db_session.commit()
    return {
        "status": "success",
        "message": f"Created {created_count} real call records.",
        "created_count": created_count
    }

@router.get("/calls/{call_id}", response_model=CallResponse)
def get_call(
    call_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    logger.info(f"📞 Fetching specific call: {call_id} for tenant {tenant_id}")
    # Find the call by ID and join with conversation to get customer_id and voice session for additional data
    call_result = db_session.query(models.Call, models.Conversation.customer_id, models.VoiceSession)\
        .outerjoin(models.Conversation, models.Call.conversation_id == models.Conversation.id)\
        .outerjoin(models.VoiceSession, models.Call.conversation_id == models.VoiceSession.conversation_id)\
        .filter(models.Call.id == call_id, models.Call.tenant_id == tenant_id)\
        .first()

    if not call_result:
        logger.warning(f"❌ Call {call_id} not found for tenant {tenant_id}")
        raise HTTPException(status_code=404, detail="Call not found")

    c, customer_id, vs = call_result

    has_recording = bool(c.recording_url or (vs.recording_url if vs else None))
    logger.info(f"📋 Call {call_id} data - Recording: {has_recording}, Voice Session: {bool(vs)}, Intent: {vs.extracted_intent if vs else 'None'}")

    response = CallResponse(
        id=c.id,
        conversation_id=c.conversation_id,
        customer_id=customer_id,
        direction=c.direction.value if hasattr(c.direction, 'value') else str(c.direction),
        status=c.status.value if hasattr(c.status, 'value') else str(c.status),
        outcome=c.outcome.value if hasattr(c.outcome, 'value') and c.outcome else None,
        created_at=c.created_at,
        handle_sec=c.handle_sec,
        recording_url=c.recording_url or (vs.recording_url if vs else None),  # Use recording URL from either call or voice session
        voice_session_id=getattr(c, 'voice_session_id', None) or (vs.id if vs else None),  # Use voice session ID from either source
        extracted_intent=vs.extracted_intent if vs else None,
        summary=vs.summary if vs else None,
        agent_name=vs.agent_name if vs else None,
        session_status=vs.status.value if vs and hasattr(vs.status, 'value') else (vs.status if vs else None)
    )

    logger.info(f"✅ Call {call_id} response prepared - Recording URL: {has_recording}")
    return response

@router.get("/calls", response_model=List[CallResponse])
def get_calls(
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
):
    logger.info(f"📞 Fetching calls for tenant {tenant_id}, limit: {limit}")
    results = db_session.query(models.Call, models.Conversation.customer_id, models.VoiceSession)\
        .outerjoin(models.Conversation, models.Call.conversation_id == models.Conversation.id)\
        .outerjoin(models.VoiceSession, models.Call.conversation_id == models.VoiceSession.conversation_id)\
        .filter(models.Call.tenant_id == tenant_id)\
        .order_by(models.Call.created_at.desc())\
        .offset(skip).limit(limit).all()

    calls_with_recording = [c for c, _, _ in results if c.recording_url]
    calls_with_voice_session = [c for c, _, vs in results if vs]

    logger.info(f"📊 Found {len(results)} calls total, {len(calls_with_recording)} with recording URLs, {len(calls_with_voice_session)} with voice session data")

    call_responses = [
        CallResponse(
            id=c.id,
            conversation_id=c.conversation_id,
            customer_id=cid,
            direction=c.direction.value if hasattr(c.direction, 'value') else str(c.direction),
            status=c.status.value if hasattr(c.status, 'value') else str(c.status),
            outcome=c.outcome.value if hasattr(c.outcome, 'value') and c.outcome else None,
            created_at=c.created_at,
            handle_sec=c.handle_sec,
            recording_url=c.recording_url or (vs.recording_url if vs else None),  # Use recording URL from either call or voice session
            voice_session_id=getattr(c, 'voice_session_id', None) or (vs.id if vs else None),  # Use voice session ID from either source
            extracted_intent=vs.extracted_intent if vs else None,
            summary=vs.summary if vs else None,
            agent_name=vs.agent_name if vs else None,
            session_status=vs.status.value if vs and hasattr(vs.status, 'value') else (vs.status if vs else None)
        )
        for c, cid, vs in results
    ]

    logger.info(f"✅ Returning {len(call_responses)} call responses with various data points")
    return call_responses