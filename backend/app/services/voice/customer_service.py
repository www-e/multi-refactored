"""
Customer service for voice operations
Handles customer creation, updates, and management for voice sessions
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "id") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

def get_or_create_customer(
    db_session: Session,
    customer_phone: Optional[str] = None,
    customer_name: Optional[str] = None,
    tenant_id: str = "demo-tenant",
    customer_id: Optional[str] = None
) -> models.Customer:
    """
    Finds a customer by phone or creates a new one.
    If customer_id is provided, tries to find by ID first.
    """
    customer = None

    # Try to find by ID first if provided
    if customer_id:
        customer = db_session.query(models.Customer).filter(
            models.Customer.id == customer_id
        ).first()

    # If no customer found by ID, try to find by phone
    if not customer and customer_phone:
        customer = db_session.query(models.Customer).filter(
            models.Customer.phone == customer_phone
        ).first()

    if not customer:
        customer = models.Customer(
            id=customer_id or generate_id("cust"),
            tenant_id=tenant_id,
            name=customer_name or "Unknown Customer",
            phone=customer_phone or "N/A",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(customer)
        db_session.flush()  # Ensure customer has an ID

    return customer


def update_customer_info(
    db_session: Session,
    customer_id: str,
    name: Optional[str] = None,
    phone: Optional[str] = None
) -> bool:
    """
    Update customer information
    """
    customer = db_session.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()
    
    if not customer:
        return False
    
    if name:
        customer.name = name
    if phone:
        customer.phone = phone
    
    db_session.commit()
    return True


def get_customer_by_phone(db_session: Session, phone: str) -> Optional[models.Customer]:
    """
    Get customer by phone number
    """
    return db_session.query(models.Customer).filter(
        models.Customer.phone == phone
    ).first()