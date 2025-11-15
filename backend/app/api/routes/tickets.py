# backend/app/api/routes/tickets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models
from app.api import deps
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

def generate_id(prefix: str = "tkt") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class TicketCreateRequest(BaseModel):
    customerId: str
    priority: models.TicketPriorityEnum
    category: str
    issue: str
    project: str

class TicketStatusUpdateRequest(BaseModel):
    status: models.TicketStatusEnum

def format_ticket(t: models.Ticket):
    return {
        "id": t.id, "customerId": t.customer_id, "category": t.category, 
        "customer_name": t.customer_name, "phone": t.phone,
        "issue": t.issue, "project": t.project, 
        "priority": t.priority.value if t.priority else "med",
        "status": t.status.value if t.status else "open", 
        "createdAt": t.created_at.isoformat(),
        "assignee": t.assignee, "propertyId": t.property_id
    }

@router.post("/tickets", status_code=201)
def create_ticket(ticket_in: TicketCreateRequest, db_session: Session = Depends(deps.get_session), _=Depends(deps.get_current_user)):
    customer = db_session.query(models.Customer).filter(models.Customer.id == ticket_in.customerId).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_ticket = models.Ticket(
        id=generate_id(),
        tenant_id="demo-tenant",
        customer_id=customer.id,
        customer_name=customer.name,
        phone=customer.phone,
        priority=ticket_in.priority,
        category=ticket_in.category,
        status=models.TicketStatusEnum.open,
        issue=ticket_in.issue,
        project=ticket_in.project,
        created_at=datetime.utcnow()
    )
    db_session.add(db_ticket)
    db_session.commit()
    db_session.refresh(db_ticket)
    return format_ticket(db_ticket)

@router.get("/tickets", response_model=List[dict])
def get_tickets(_=Depends(deps.get_current_user), limit: int = 50, db_session: Session = Depends(deps.get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(limit).all()
    return [format_ticket(t) for t in tickets]

@router.get("/tickets/recent", response_model=List[dict])
def get_recent_tickets(_=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(10).all()
    return [format_ticket(t) for t in tickets]

@router.patch("/tickets/{ticket_id}")
def update_ticket_status(ticket_id: str, body: TicketStatusUpdateRequest, _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    ticket = db_session.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = body.status
    db_session.commit()
    db_session.refresh(ticket)
    return {"message": "Ticket status updated successfully", "id": ticket.id, "new_status": ticket.status.value}