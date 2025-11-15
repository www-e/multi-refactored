# backend/app/api/routes/campaigns.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models
from app.api import deps
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

def generate_id(prefix: str = "cmp") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class CampaignCreateRequest(BaseModel):
    name: str
    type: models.CampaignTypeEnum
    objective: str
    audienceQuery: dict

def format_campaign(c: models.Campaign):
    # In a real app, metrics would be calculated, here we use defaults
    return {
        "id": c.id,
        "name": c.name,
        "type": c.type.value,
        "objective": c.objective,
        "status": c.status,
        "audienceQuery": c.audience_query,
        "createdAt": c.created_at.isoformat(),
        "metrics": {
            "reached": 0, "engaged": 0, "qualified": 0,
            "booked": 0, "revenue": 0, "roas": 0.0
        },
        "attribution": "Human" # Manually created campaigns are by humans
    }

@router.post("/campaigns", status_code=201)
def create_campaign(campaign_in: CampaignCreateRequest, db_session: Session = Depends(deps.get_session), _=Depends(deps.get_current_user)):
    db_campaign = models.Campaign(
        id=generate_id(),
        tenant_id="demo-tenant",
        name=campaign_in.name,
        type=campaign_in.type,
        objective=campaign_in.objective,
        audience_query=campaign_in.audienceQuery,
        status="موقوفة", # New campaigns start as paused
        created_at=datetime.utcnow()
    )
    db_session.add(db_campaign)
    db_session.commit()
    db_session.refresh(db_campaign)
    return format_campaign(db_campaign)

@router.get("/campaigns", response_model=List[dict])
def get_campaigns(_=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    campaigns = db_session.query(models.Campaign).order_by(models.Campaign.created_at.desc()).all()
    return [format_campaign(c) for c in campaigns]