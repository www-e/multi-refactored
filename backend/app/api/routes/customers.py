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