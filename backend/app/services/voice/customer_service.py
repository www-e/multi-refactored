import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models
import secrets

logger = logging.getLogger(__name__)

def generate_id() -> str:
    return f"cust_{secrets.token_hex(8)}"

def get_or_create_customer(
    db_session: Session,
    customer_phone: str,
    customer_name: str = None,
    tenant_id: str = "demo-tenant"
) -> models.Customer:
    
    # STRICT VALIDATION: If no phone, we cannot create a valid customer record.
    # However, to prevent DB crashes on foreign keys, we might need a fallback,
    # but let's make it obvious it's missing.
    if not customer_phone or not customer_phone.strip():
        customer_phone = "UNKNOWN_PHONE"

    # Search
    customer = db_session.query(models.Customer).filter(
        models.Customer.phone == customer_phone,
        models.Customer.tenant_id == tenant_id
    ).first()

    if customer:
        # Update name ONLY if we have a real one
        if customer_name and customer_name.strip():
            if customer.name != customer_name:
                customer.name = customer_name
                db_session.add(customer)
    else:
        # Create
        # If no name provided, use Phone as name (Clean, no "Guest" strings)
        final_name = customer_name if (customer_name and customer_name.strip()) else customer_phone
        
        customer = models.Customer(
            id=generate_id(),
            tenant_id=tenant_id,
            name=final_name,
            phone=customer_phone,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(customer)
    
    db_session.flush()
    return customer