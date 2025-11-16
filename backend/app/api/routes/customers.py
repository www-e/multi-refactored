# backend/app/api/routes/customers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.api import deps

router = APIRouter()

def generate_id(prefix: str = "cust") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

@router.post("/customers", response_model=schemas.Customer)
def create_customer(
    *,
    db_session: Session = Depends(deps.get_session),
    customer_in: schemas.CustomerCreate,
    _=Depends(deps.get_current_user)
):
    """
    Create a new customer.
    """
    # Check if a customer with the same phone or email already exists
    existing_customer = db_session.query(models.Customer).filter(
        (models.Customer.phone == customer_in.phone) | 
        (models.Customer.email == customer_in.email)
    ).first()
    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this phone number or email already exists.",
        )
    
    db_customer = models.Customer(
        id=generate_id(),
        name=customer_in.name,
        phone=customer_in.phone,
        email=customer_in.email,
        tenant_id="demo-tenant", # Hardcoded for now
    )
    db_session.add(db_customer)
    db_session.commit()
    db_session.refresh(db_customer)
    return db_customer

@router.get("/customers", response_model=List[schemas.Customer])
def get_customers(
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve a list of customers.
    """
    customers = db_session.query(models.Customer).offset(skip).limit(limit).all()
    return customers

@router.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(
    customer_id: str,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Retrieve a specific customer by ID.
    """
    customer = db_session.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )
    return customer

@router.patch("/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(
    *,
    db_session: Session = Depends(deps.get_session),
    customer_id: str,
    customer_in: schemas.CustomerUpdate,
    _=Depends(deps.get_current_user)
):
    """
    Update a customer.
    """
    customer = db_session.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    # Check if phone or email conflicts with another customer
    if customer_in.phone:
        conflicting_phone = db_session.query(models.Customer).filter(
            models.Customer.id != customer_id,
            models.Customer.phone == customer_in.phone
        ).first()
        if conflicting_phone:
            raise HTTPException(
                status_code=400,
                detail="A customer with this phone number already exists.",
            )

    if customer_in.email:
        conflicting_email = db_session.query(models.Customer).filter(
            models.Customer.id != customer_id,
            models.Customer.email == customer_in.email
        ).first()
        if conflicting_email:
            raise HTTPException(
                status_code=400,
                detail="A customer with this email already exists.",
            )

    # Update only provided fields
    update_data = customer_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    db_session.commit()
    db_session.refresh(customer)
    return customer

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: str,
    db_session: Session = Depends(deps.get_session),
    _=Depends(deps.get_current_user)
):
    """
    Delete a customer.
    """
    customer = db_session.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )
    
    # Check if customer has related records
    has_bookings = db_session.query(models.Booking).filter(models.Booking.customer_id == customer_id).first()
    has_tickets = db_session.query(models.Ticket).filter(models.Ticket.customer_id == customer_id).first()
    has_conversations = db_session.query(models.Conversation).filter(models.Conversation.customer_id == customer_id).first()
    
    if has_bookings or has_tickets or has_conversations:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with existing bookings, tickets, or conversations. Consider deactivating instead.",
        )
    
    db_session.delete(customer)
    db_session.commit()
    return {"message": "Customer deleted successfully"}