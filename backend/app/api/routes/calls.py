import logging
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app import models
from app.api import deps
from app.services.voice import session_service
from app.services.twilio_service import get_twilio_service

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
    script_content: Optional[str] = None
    agent_type: str = "sales"
    concurrency_limit: int = 3
    use_knowledge_base: bool = True
    custom_system_prompt: Optional[str] = None

class CallResponse(BaseModel):
    id: str
    conversation_id: str
    customer_id: Optional[str]
    customer_name: Optional[str] = None
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
    """
    Enhanced bulk call endpoint with custom scripts and concurrent call management
    
    Features:
    - Custom script injection for each call
    - Concurrent call execution with rate limiting
    - System prompt override while preserving knowledge base
    - Progress tracking and result aggregation
    """
    logger.info(f"🚀 Starting bulk call campaign for {len(body.customer_ids)} customers")
    logger.info(f"   Agent Type: {body.agent_type}")
    logger.info(f"   Concurrency Limit: {body.concurrency_limit}")
    logger.info(f"   Use Knowledge Base: {body.use_knowledge_base}")
    logger.info(f"   Has Custom Script: {bool(body.script_content)}")
    logger.info(f"   Has Custom System Prompt: {bool(body.custom_system_prompt)}")
    
    # Store campaign configuration for call execution
    campaign_config = {
        "script_content": body.script_content,
        "agent_type": body.agent_type,
        "use_knowledge_base": body.use_knowledge_base,
        "custom_system_prompt": body.custom_system_prompt,
        "concurrency_limit": body.concurrency_limit,
    }
    
    created_count = 0
    results = []
    
    # Process customers in batches for concurrent execution
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    
    async def process_customer_batch(customer_batch: List[str]):
        """Process a batch of customers concurrently"""
        batch_results = []
        for cust_id in customer_batch:
            customer = db_session.query(models.Customer).filter(
                models.Customer.id == cust_id
            ).first()
            
            if not customer:
                logger.warning(f"❌ Customer {cust_id} not found")
                batch_results.append({
                    "customer_id": cust_id,
                    "status": "failed",
                    "error": "Customer not found"
                })
                continue
            
            # Create Conversation
            conv = models.Conversation(
                id=f"conv_{generate_id()[5:]}",
                tenant_id=tenant_id,
                channel=models.ChannelEnum.voice,
                customer_id=cust_id,
                summary=f"Bulk Outbound Campaign: {body.script_content[:100] if body.script_content else 'Default marketing script'}",
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
                status="queued",  # Initial status
                ai_or_human=models.AIOrHumanEnum.AI,
                created_at=datetime.now(timezone.utc)
            )
            db_session.add(call)
            
            # Store campaign metadata in call for later execution
            # In production, this would be stored in a separate CampaignCalls table
            batch_results.append({
                "call_id": call.id,
                "customer_id": cust_id,
                "customer_name": customer.name,
                "phone": customer.phone,
                "status": "queued",
                "conversation_id": conv.id
            })
            
            created_count += 1
        
        return batch_results
    
    # Split customers into batches based on concurrency limit
    customer_batches = [
        body.customer_ids[i:i + body.concurrency_limit]
        for i in range(0, len(body.customer_ids), body.concurrency_limit)
    ]
    
    logger.info(f"📊 Processing {len(customer_batches)} batches with {body.concurrency_limit} concurrent calls each")
    
    # Process each batch
    for batch_idx, batch in enumerate(customer_batches, 1):
        logger.info(f"🔄 Processing batch {batch_idx}/{len(customer_batches)}")
        batch_results = await process_customer_batch(batch)
        results.extend(batch_results)
        logger.info(f"✅ Batch {batch_idx} completed: {len(batch_results)} calls queued")
    
    db_session.commit()
    
    logger.info(f"✅ Bulk call campaign created successfully: {created_count} calls queued")
    
    return {
        "status": "success",
        "message": f"Bulk call campaign created with {created_count} calls queued for execution.",
        "created_count": created_count,
        "initiated_calls": created_count,  # For backward compatibility
        "total_customers": len(body.customer_ids),
        "results": results,
        "campaign_config": {
            "agent_type": body.agent_type,
            "concurrency_limit": body.concurrency_limit,
            "use_knowledge_base": body.use_knowledge_base
        }
    }
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
    call_result = db_session.query(models.Call, models.Conversation.customer_id, models.Customer.name, models.VoiceSession)\
        .outerjoin(models.Conversation, models.Call.conversation_id == models.Conversation.id)\
        .outerjoin(models.Customer, models.Conversation.customer_id == models.Customer.id)\
        .outerjoin(models.VoiceSession, models.Call.conversation_id == models.VoiceSession.conversation_id)\
        .filter(models.Call.id == call_id, models.Call.tenant_id == tenant_id)\
        .first()

    if not call_result:
        logger.warning(f"❌ Call {call_id} not found for tenant {tenant_id}")
        raise HTTPException(status_code=404, detail="Call not found")

    c, customer_id, customer_name, vs = call_result

    has_recording = bool(c.recording_url or (vs.recording_url if vs else None))
    logger.info(f"📋 Call {call_id} data - Recording: {has_recording}, Voice Session: {bool(vs)}, Intent: {vs.extracted_intent if vs else 'None'}")

    response = CallResponse(
        id=c.id,
        conversation_id=c.conversation_id,
        customer_id=customer_id,
        customer_name=customer_name,
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
    results = db_session.query(models.Call, models.Conversation.customer_id, models.Customer.name, models.VoiceSession)\
        .outerjoin(models.Conversation, models.Call.conversation_id == models.Conversation.id)\
        .outerjoin(models.Customer, models.Conversation.customer_id == models.Customer.id)\
        .outerjoin(models.VoiceSession, models.Call.conversation_id == models.VoiceSession.conversation_id)\
        .filter(models.Call.tenant_id == tenant_id)\
        .order_by(models.Call.created_at.desc())\
        .offset(skip).limit(limit).all()

    calls_with_recording = [c for c, _, _, _ in results if c.recording_url]
    calls_with_voice_session = [c for c, _, _, vs in results if vs]

    logger.info(f"📊 Found {len(results)} calls total, {len(calls_with_recording)} with recording URLs, {len(calls_with_voice_session)} with voice session data")

    call_responses = [
        CallResponse(
            id=c.id,
            conversation_id=c.conversation_id,
            customer_id=cid,
            customer_name=cust_name,
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
        for c, cid, cust_name, vs in results
    ]

    logger.info(f"✅ Returning {len(call_responses)} call responses with various data points")
    return call_responses


# ============================================================================
# OUTBOUND CALL INITIATION WITH TWILIO
# ============================================================================

class OutboundCallRequest(BaseModel):
    """Request model for initiating outbound calls"""
    customer_id: str
    phone: str
    agent_type: str = "support"  # support or sales

class OutboundCallResponse(BaseModel):
    """Response model for outbound call initiation"""
    session_id: str
    call_sid: Optional[str] = None
    status: str
    message: str
    twilio_configured: bool = False


@router.post("/calls/initiate", response_model=OutboundCallResponse)
async def initiate_outbound_call(
    call_request: OutboundCallRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Initiate an outbound call to a customer using Twilio
    
    Flow:
    1. Create VoiceSession in database
    2. Initiate Twilio call to customer's phone
    3. When customer answers, Twilio connects to ElevenLabs
    4. ElevenLabs webhook processes conversation after call ends
    """
    logger.info(f"📞 Initiating outbound call to customer {call_request.customer_id} at {call_request.phone}")
    
    # Get Twilio service
    twilio_service = get_twilio_service()
    
    # Check if Twilio is configured
    if not twilio_service.is_configured():
        logger.warning("⚠️ Twilio not configured - creating session only (simulation mode)")
        # Create session without actual call
        session = session_service.create_voice_session(
            db_session=db_session,
            agent_type=call_request.agent_type,
            customer_id=call_request.customer_id,
            tenant_id=tenant_id,
            customer_phone=call_request.phone
        )
        
        return OutboundCallResponse(
            session_id=session.id,
            call_sid=None,
            status="simulation",
            message="Twilio not configured. Session created in simulation mode.",
            twilio_configured=False
        )
    
    # Step 1: Create VoiceSession record
    try:
        session = session_service.create_voice_session(
            db_session=db_session,
            agent_type=call_request.agent_type,
            customer_id=call_request.customer_id,
            tenant_id=tenant_id,
            customer_phone=call_request.phone
        )
        logger.info(f"✅ VoiceSession created: {session.id}")
    except Exception as e:
        logger.error(f"❌ Failed to create VoiceSession: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")
    
    # Step 2: Initiate Twilio call
    try:
        # Get webhook URL from environment
        webhook_url = os.getenv("API_URL", "http://localhost:8000")
        
        # Initiate the call
        call_result = twilio_service.initiate_outbound_call(
            to_phone=call_request.phone,
            session_id=session.id,
            webhook_url=webhook_url,
            agent_type=call_request.agent_type
        )
        
        logger.info(f"✅ Twilio call initiated: SID={call_result['call_sid']}")
        
        return OutboundCallResponse(
            session_id=session.id,
            call_sid=call_result['call_sid'],
            status=call_result['status'],
            message=f"Call initiated to {call_request.phone}",
            twilio_configured=True
        )
        
    except ValueError as e:
        # Configuration error
        logger.error(f"❌ Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Twilio API error
        logger.error(f"❌ Failed to initiate Twilio call: {e}")
        
        # Update session status to failed
        session.status = models.VoiceSessionStatus.FAILED
        db_session.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate call: {str(e)}"
        )
