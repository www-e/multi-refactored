"""
Bulk Call Campaign Routes
API endpoints for managing bulk call scripts, campaigns, and results
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api import deps
from app import models
from app.services.bulk_call_service import (
    BulkCallScriptService,
    BulkCallCampaignService,
    BulkCallResultService,
    BulkCallExecutionService
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# PYDANTIC MODELS (REQUEST/RESPONSE SCHEMAS)
# ============================================================================

class ScriptCreateRequest(BaseModel):
    name: str
    content: str
    agent_type: str  # 'sales' or 'support'
    description: Optional[str] = None
    category: str = "general"
    tags: Optional[List[str]] = None
    is_template: bool = False

class ScriptUpdateRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ScriptResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    content: str
    variables: Optional[List[str]]
    agent_type: str
    category: str
    tags: Optional[List[str]]
    usage_count: int
    last_used_at: Optional[str]
    created_by: str
    is_template: bool
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class CampaignCreateRequest(BaseModel):
    name: str
    customer_ids: List[str]
    script_content: str
    agent_type: str = "sales"
    concurrency_limit: int = 3
    use_knowledge_base: bool = True
    custom_system_prompt: Optional[str] = None
    script_id: Optional[str] = None

class CampaignResponse(BaseModel):
    id: str
    name: str
    status: str
    total_calls: int
    completed_calls: int
    failed_calls: int
    successful_calls: int
    progress: float
    agent_type: str
    concurrency_limit: int
    use_knowledge_base: bool
    custom_system_prompt: Optional[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True

class CampaignWithResultsResponse(CampaignResponse):
    results: List[dict]

class CallResultResponse(BaseModel):
    id: str
    campaign_id: str
    customer_id: str
    customer_name: str
    customer_phone: str
    status: str
    outcome: Optional[str]
    duration_seconds: Optional[int]
    recording_url: Optional[str]
    error_message: Optional[str]
    twilio_call_sid: Optional[str]
    twilio_status: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# ============================================================================
# SCRIPT MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/scripts", response_model=ScriptResponse)
def create_script(
    request: ScriptCreateRequest,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Create a new bulk call script"""
    logger.info(f"Creating script: {request.name}")
    
    script = BulkCallScriptService.create_script(
        db=db,
        tenant_id=tenant_id,
        name=request.name,
        content=request.content,
        agent_type=request.agent_type,
        description=request.description,
        category=request.category,
        tags=request.tags,
        created_by="user",
        is_template=request.is_template
    )
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        content=script.content,
        variables=script.variables,
        agent_type=script.agent_type,
        category=script.category,
        tags=script.tags,
        usage_count=script.usage_count,
        last_used_at=script.last_used_at.isoformat() if script.last_used_at else None,
        created_by=script.created_by,
        is_template=script.is_template,
        is_active=script.is_active,
        created_at=script.created_at.isoformat(),
        updated_at=script.updated_at.isoformat()
    )

@router.get("/scripts", response_model=List[ScriptResponse])
def get_scripts(
    category: Optional[str] = None,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Get all scripts for tenant"""
    logger.info(f"Fetching scripts for tenant: {tenant_id}")
    
    scripts = BulkCallScriptService.get_scripts(
        db=db,
        tenant_id=tenant_id,
        category=category
    )
    
    return [
        ScriptResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            content=s.content,
            variables=s.variables,
            agent_type=s.agent_type,
            category=s.category,
            tags=s.tags,
            usage_count=s.usage_count,
            last_used_at=s.last_used_at.isoformat() if s.last_used_at else None,
            created_by=s.created_by,
            is_template=s.is_template,
            is_active=s.is_active,
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat()
        )
        for s in scripts
    ]

@router.get("/scripts/{script_id}", response_model=ScriptResponse)
def get_script(
    script_id: str,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Get single script by ID"""
    script = BulkCallScriptService.get_script(db, script_id, tenant_id)
    
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        content=script.content,
        variables=script.variables,
        agent_type=script.agent_type,
        category=script.category,
        tags=script.tags,
        usage_count=script.usage_count,
        last_used_at=script.last_used_at.isoformat() if script.last_used_at else None,
        created_by=script.created_by,
        is_template=script.is_template,
        is_active=script.is_active,
        created_at=script.created_at.isoformat(),
        updated_at=script.updated_at.isoformat()
    )

@router.put("/scripts/{script_id}", response_model=ScriptResponse)
def update_script(
    script_id: str,
    request: ScriptUpdateRequest,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Update script"""
    update_data = request.model_dump(exclude_unset=True)
    script = BulkCallScriptService.update_script(
        db=db,
        script_id=script_id,
        tenant_id=tenant_id,
        **update_data
    )
    
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        content=script.content,
        variables=script.variables,
        agent_type=script.agent_type,
        category=script.category,
        tags=script.tags,
        usage_count=script.usage_count,
        last_used_at=script.last_used_at.isoformat() if script.last_used_at else None,
        created_by=script.created_by,
        is_template=script.is_template,
        is_active=script.is_active,
        created_at=script.created_at.isoformat(),
        updated_at=script.updated_at.isoformat()
    )

@router.delete("/scripts/{script_id}")
def delete_script(
    script_id: str,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Delete script (soft delete)"""
    success = BulkCallScriptService.delete_script(db, script_id, tenant_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Script not found")
    
    return {"message": "Script deleted successfully"}


# ============================================================================
# CAMPAIGN MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/campaigns/bulk", response_model=CampaignResponse)
def create_bulk_campaign(
    request: CampaignCreateRequest,
    background_tasks: BackgroundTasks,
    req: Request,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Create and execute a new bulk call campaign"""
    logger.info(f"Creating bulk campaign: {request.name} for {len(request.customer_ids)} customers")
    
    # Generate campaign name from request or use timestamp
    campaign_name = request.name or f"Bulk Call Campaign {datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Create campaign
    campaign = BulkCallCampaignService.create_campaign(
        db=db,
        tenant_id=tenant_id,
        name=campaign_name,
        customer_ids=request.customer_ids,
        script_content=request.script_content,
        agent_type=request.agent_type,
        concurrency_limit=request.concurrency_limit,
        use_knowledge_base=request.use_knowledge_base,
        custom_system_prompt=request.custom_system_prompt,
        script_id=request.script_id
    )
    
    # Increment script usage if script was used
    if request.script_id:
        BulkCallScriptService.increment_usage(db, request.script_id)
    
    # Execute campaign in background
    def execute_campaign_task():
        try:
            webhook_base_url = str(req.base_url).rstrip('/')
            BulkCallExecutionService.execute_campaign(
                db=db,
                campaign_id=campaign.id,
                tenant_id=tenant_id,
                webhook_base_url=webhook_base_url
            )
        except Exception as e:
            logger.error(f"❌ Campaign execution failed: {e}")
            BulkCallCampaignService.update_campaign_status(
                db,
                campaign.id,
                models.BulkCallStatusEnum.failed
            )
    
    background_tasks.add_task(execute_campaign_task)
    
    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        status=campaign.status.value,
        total_calls=campaign.total_calls,
        completed_calls=campaign.completed_calls,
        failed_calls=campaign.failed_calls,
        successful_calls=campaign.successful_calls,
        progress=campaign.calculate_progress(),
        agent_type=campaign.agent_type,
        concurrency_limit=campaign.concurrency_limit,
        use_knowledge_base=campaign.use_knowledge_base,
        custom_system_prompt=campaign.custom_system_prompt,
        created_at=campaign.created_at.isoformat(),
        started_at=campaign.started_at.isoformat() if campaign.started_at else None,
        completed_at=campaign.completed_at.isoformat() if campaign.completed_at else None
    )

@router.get("/campaigns/bulk", response_model=List[CampaignResponse])
def get_bulk_campaigns(
    status: Optional[str] = None,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Get all bulk campaigns for tenant"""
    logger.info(f"Fetching bulk campaigns for tenant: {tenant_id}")
    
    # Convert string status to enum if provided
    status_enum = None
    if status:
        try:
            status_enum = models.BulkCallStatusEnum(status)
        except ValueError:
            pass
    
    campaigns = BulkCallCampaignService.get_campaigns(
        db=db,
        tenant_id=tenant_id,
        status=status_enum
    )
    
    return [
        CampaignResponse(
            id=c.id,
            name=c.name,
            status=c.status.value,
            total_calls=c.total_calls,
            completed_calls=c.completed_calls,
            failed_calls=c.failed_calls,
            successful_calls=c.successful_calls,
            progress=c.calculate_progress(),
            agent_type=c.agent_type,
            concurrency_limit=c.concurrency_limit,
            use_knowledge_base=c.use_knowledge_base,
            custom_system_prompt=c.custom_system_prompt,
            created_at=c.created_at.isoformat(),
            started_at=c.started_at.isoformat() if c.started_at else None,
            completed_at=c.completed_at.isoformat() if c.completed_at else None
        )
        for c in campaigns
    ]

@router.get("/campaigns/bulk/{campaign_id}", response_model=CampaignWithResultsResponse)
def get_bulk_campaign_with_results(
    campaign_id: str,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Get campaign with all call results"""
    campaign = BulkCallCampaignService.get_campaign(db, campaign_id, tenant_id)
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    results = BulkCallResultService.get_results_for_campaign(db, campaign_id, tenant_id)
    
    return CampaignWithResultsResponse(
        id=campaign.id,
        name=campaign.name,
        status=campaign.status.value,
        total_calls=campaign.total_calls,
        completed_calls=campaign.completed_calls,
        failed_calls=campaign.failed_calls,
        successful_calls=campaign.successful_calls,
        progress=campaign.calculate_progress(),
        agent_type=campaign.agent_type,
        concurrency_limit=campaign.concurrency_limit,
        use_knowledge_base=campaign.use_knowledge_base,
        custom_system_prompt=campaign.custom_system_prompt,
        created_at=campaign.created_at.isoformat(),
        started_at=campaign.started_at.isoformat() if campaign.started_at else None,
        completed_at=campaign.completed_at.isoformat() if campaign.completed_at else None,
        results=[
            {
                "id": r.id,
                "campaign_id": r.campaign_id,
                "customer_id": r.customer_id,
                "customer_name": r.customer_name,
                "customer_phone": r.customer_phone,
                "status": r.status.value,
                "outcome": r.outcome.value if r.outcome else None,
                "duration_seconds": r.duration_seconds,
                "recording_url": r.recording_url,
                "error_message": r.error_message,
                "twilio_call_sid": r.twilio_call_sid,
                "twilio_status": r.twilio_status,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat()
            }
            for r in results
        ]
    )

@router.get("/campaigns/bulk/{campaign_id}/results", response_model=List[CallResultResponse])
def get_campaign_results(
    campaign_id: str,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Get all call results for a campaign"""
    # Verify campaign exists
    campaign = BulkCallCampaignService.get_campaign(db, campaign_id, tenant_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    results = BulkCallResultService.get_results_for_campaign(db, campaign_id, tenant_id)
    
    return [
        CallResultResponse(
            id=r.id,
            campaign_id=r.campaign_id,
            customer_id=r.customer_id,
            customer_name=r.customer_name,
            customer_phone=r.customer_phone,
            status=r.status.value,
            outcome=r.outcome.value if r.outcome else None,
            duration_seconds=r.duration_seconds,
            recording_url=r.recording_url,
            error_message=r.error_message,
            twilio_call_sid=r.twilio_call_sid,
            twilio_status=r.twilio_status,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat()
        )
        for r in results
    ]


# ============================================================================
# WEBHOOK ENDPOINTS (TWILIO STATUS UPDATES)
# ============================================================================

@router.post("/webhooks/twilio/status")
async def twilio_status_webhook(
    request: Request,
    db: Session = Depends(deps.get_session)
):
    """
    Receive status updates from Twilio for outbound calls
    Called by Twilio when call status changes
    """
    try:
        data = await request.form()
        
        call_sid = data.get('CallSid')
        call_status = data.get('CallStatus')
        
        if not call_sid or not call_status:
            logger.warning("⚠️ Invalid webhook payload")
            return {"status": "error", "message": "Invalid payload"}
        
        logger.info(f"📞 Received Twilio webhook: {call_sid} - {call_status}")
        
        # Find result by Twilio Call SID
        result = db.query(models.BulkCallResult).filter_by(
            twilio_call_sid=call_sid
        ).first()
        
        if not result:
            logger.warning(f"⚠️ No result found for Twilio call SID: {call_sid}")
            return {"status": "ok"}  # Return OK to avoid retries
        
        # Map Twilio status to our status
        status_mapping = {
            'queued': models.BulkCallResultStatusEnum.queued,
            'ringing': models.BulkCallResultStatusEnum.in_progress,
            'in-progress': models.BulkCallResultStatusEnum.in_progress,
            'completed': models.BulkCallResultStatusEnum.success,
            'failed': models.BulkCallResultStatusEnum.failed,
            'busy': models.BulkCallResultStatusEnum.busy,
            'no-answer': models.BulkCallResultStatusEnum.no_answer
        }
        
        new_status = status_mapping.get(call_status, models.BulkCallResultStatusEnum.in_progress)
        
        # Update result status
        BulkCallResultService.update_result_status(
            db=db,
            result_id=result.id,
            status=new_status,
            twilio_status=call_status
        )
        
        logger.info(f"✅ Updated result {result.id} status to {new_status.value}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"❌ Error processing Twilio webhook: {e}")
        return {"status": "error", "message": str(e)}
