"""
Scripts Management Routes
Dedicated endpoint for script CRUD operations
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.services.bulk_call_service import BulkCallScriptService

# Reuse schemas from bulk_campaigns
from app.api.routes.bulk_campaigns import (
    ScriptCreateRequest,
    ScriptUpdateRequest,
    ScriptResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/scripts", response_model=ScriptResponse)
def create_script(
    request: ScriptCreateRequest,
    db: Session = Depends(deps.get_session),
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user)
):
    """Create a new script"""
    logger.info(f"Creating script: {request.name} for tenant: {tenant_id}")
    
    script = BulkCallScriptService.create_script(
        db=db,
        tenant_id=tenant_id,
        name=request.name,
        content=request.content,
        agent_type=request.agent_type,
        description=request.description,
        category=request.category,
        tags=request.tags,
        is_template=request.is_template
    )
    
    logger.info(f"✅ Script created: {script.id}")
    
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
    logger.info(f"📜 Fetching scripts for tenant: {tenant_id}, category: {category or 'all'}")
    
    scripts = BulkCallScriptService.get_scripts(
        db=db,
        tenant_id=tenant_id,
        category=category
    )
    
    logger.info(f"✅ Found {len(scripts)} scripts")
    
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
    logger.info(f"📜 Fetching script: {script_id}")
    
    script = BulkCallScriptService.get_script(db, script_id, tenant_id)
    
    if not script:
        logger.warning(f"❌ Script not found: {script_id}")
        raise HTTPException(status_code=404, detail="Script not found")
    
    logger.info(f"✅ Script found: {script_id}")
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        content=script.content,
        variables=script.variables,
        agent_type=script.agent_type,
        category=s.category,
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
    logger.info(f"📝 Updating script: {script_id}")
    
    update_data = request.model_dump(exclude_unset=True)
    script = BulkCallScriptService.update_script(
        db=db,
        script_id=script_id,
        tenant_id=tenant_id,
        **update_data
    )
    
    if not script:
        logger.warning(f"❌ Script not found for update: {script_id}")
        raise HTTPException(status_code=404, detail="Script not found")
    
    logger.info(f"✅ Script updated: {script_id}")
    
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
    logger.info(f"🗑️  Deleting script: {script_id}")
    
    success = BulkCallScriptService.delete_script(db, script_id, tenant_id)
    
    if not success:
        logger.warning(f"❌ Script not found for deletion: {script_id}")
        raise HTTPException(status_code=404, detail="Script not found")
    
    logger.info(f"✅ Script deleted: {script_id}")
    
    return {"message": "Script deleted successfully", "script_id": script_id}
