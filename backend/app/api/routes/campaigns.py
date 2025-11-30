# backend/app/api/routes/campaigns.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models
from app.api import deps
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

def generate_id(prefix: str = "cmp") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class CampaignCreateRequest(BaseModel):
    name: str
    type: models.CampaignTypeEnum
    objective: str
    audienceQuery: dict

class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    audienceQuery: Optional[dict] = None
    status: Optional[str] = None

def format_campaign(c: models.Campaign, db_session):
    # Get the latest metrics for this campaign
    from sqlalchemy import func

    # Get the most recent metrics record for this campaign
    latest_metrics = db_session.query(models.CampaignMetrics).filter(
        models.CampaignMetrics.campaign_id == c.id
    ).order_by(models.CampaignMetrics.ts.desc()).first()

    # If metrics exist, use them; otherwise default to 0
    if latest_metrics:
        metrics = {
            "reached": latest_metrics.reached,
            "engaged": latest_metrics.engaged,
            "qualified": latest_metrics.qualified,
            "booked": latest_metrics.booked,
            "revenue": latest_metrics.revenue_sar,
            "roas": latest_metrics.roas
        }
    else:
        # Default values if no metrics exist yet
        metrics = {
            "reached": 0,
            "engaged": 0,
            "qualified": 0,
            "booked": 0,
            "revenue": 0,
            "roas": 0.0
        }

    return {
        "id": c.id,
        "name": c.name,
        "type": c.type.value,
        "objective": c.objective,
        "status": c.status,
        "audienceQuery": c.audience_query,
        "createdAt": c.created_at.isoformat(),
        "metrics": metrics,
        "attribution": "Human"  # Manually created campaigns are by humans
    }

@router.post("/campaigns", status_code=201)
def create_campaign(campaign_in: CampaignCreateRequest, tenant_id: str = Depends(deps.get_current_tenant_id), db_session: Session = Depends(deps.get_session), _=Depends(deps.get_current_user)):
    db_campaign = models.Campaign(
        id=generate_id(),
        tenant_id=tenant_id,
        name=campaign_in.name,
        type=campaign_in.type,
        objective=campaign_in.objective,
        audience_query=campaign_in.audienceQuery,
        status="موقوفة", # New campaigns start as paused
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(db_campaign)
    db_session.commit()
    db_session.refresh(db_campaign)
    return format_campaign(db_campaign, db_session)

@router.get("/campaigns", response_model=List[dict])
def get_campaigns(tenant_id: str = Depends(deps.get_current_tenant_id), _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    campaigns = db_session.query(models.Campaign).filter(models.Campaign.tenant_id == tenant_id).order_by(models.Campaign.created_at.desc()).all()
    return [format_campaign(c, db_session) for c in campaigns]

@router.get("/campaigns/{campaign_id}", response_model=dict)
def get_campaign(
    campaign_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a specific campaign by ID.
    """
    campaign = db_session.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.tenant_id == tenant_id
    ).first()
    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )
    return format_campaign(campaign, db_session)

@router.patch("/campaigns/{campaign_id}", response_model=dict)
def update_campaign(
    *,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    campaign_id: str,
    campaign_in: CampaignUpdateRequest,
    _=Depends(deps.get_current_user)
):
    """
    Update a campaign.
    """
    campaign = db_session.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.tenant_id == tenant_id
    ).first()
    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # Update only provided fields
    update_data = campaign_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "audienceQuery":
            campaign.audience_query = value
        elif hasattr(campaign, field):
            setattr(campaign, field, value)

    db_session.commit()
    db_session.refresh(campaign)
    return format_campaign(campaign, db_session)

@router.delete("/campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Delete a campaign.
    """
    campaign = db_session.query(models.Campaign).filter(
        models.Campaign.id == campaign_id,
        models.Campaign.tenant_id == tenant_id
    ).first()
    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # Check if campaign has related metrics
    has_metrics = db_session.query(models.CampaignMetrics).filter(
        models.CampaignMetrics.campaign_id == campaign_id,
        # Note: CampaignMetrics doesn't have tenant_id, so we check via campaign relationship
        models.CampaignMetrics.campaign_id.in_(
            db_session.query(models.Campaign.id).filter(models.Campaign.tenant_id == tenant_id)
        )
    ).first()

    if has_metrics:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete campaign with existing metrics. Consider deactivating instead.",
        )

    db_session.delete(campaign)
    db_session.commit()
    return {"message": "Campaign deleted successfully"}