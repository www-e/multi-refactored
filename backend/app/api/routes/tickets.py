# backend/app/api/routes/tickets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import models
from app.api import deps
from pydantic import BaseModel

router = APIRouter()

class TicketStatusUpdateRequest(BaseModel):
    status: models.TicketStatusEnum

@router.get("/tickets", response_model=List[dict])
def get_tickets(_=Depends(deps.get_current_user), limit: int = 50, db_session: Session = Depends(deps.get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(limit).all()
    return [{
        "id": t.id, "category": t.category, "customer_name": t.customer_name, "phone": t.phone,
        "issue": t.issue, "project": t.project, "priority": t.priority.value if t.priority else "medium",
        "status": t.status.value if t.status else "open", "created_at": t.created_at.isoformat()
    } for t in tickets]

@router.get("/tickets/recent", response_model=List[dict])
def get_recent_tickets(_=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(10).all()
    return [{
        "id": t.id, "category": t.category, "customer_name": t.customer_name, "phone": t.phone,
        "issue": t.issue, "project": t.project, "priority": t.priority.value if t.priority else "medium",
        "status": t.status.value if t.status else "open", "created_at": t.created_at.isoformat()
    } for t in tickets]

@router.patch("/tickets/{ticket_id}")
def update_ticket_status(ticket_id: str, body: TicketStatusUpdateRequest, _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    ticket = db_session.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = body.status
    db_session.commit()
    db_session.refresh(ticket)
    return {"message": "Ticket status updated successfully", "id": ticket.id, "new_status": ticket.status.value}