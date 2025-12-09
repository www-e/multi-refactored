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
    tenant_id: str = "demo-tenant"
) -> models.Customer:
    """
    Finds a customer by phone.
    1. If found, UPDATES their name if a new name is provided by AI.
    2. If not found, CREATES a new real customer record.
    """
    
    # 1. Clean the phone number (remove spaces, etc if needed)
    # The AI gave "01154688628", we use it exactly.
    clean_phone = customer_phone.strip() if customer_phone else ""
    
    if not clean_phone:
        # Fallback only if absolutely no phone exists
        # This creates a placeholder only if the AI failed completely to get a number
        logger.warning("⚠️ No phone number provided. Creating untrackable guest.")
        clean_phone = "0000000000"

    # 2. Search for existing customer
    customer = db_session.query(models.Customer).filter(
        models.Customer.phone == clean_phone,
        models.Customer.tenant_id == tenant_id
    ).first()

    # 3. If found, UPDATE metadata (This fixes the "Real Customer" issue)
    if customer:
        logger.info(f"✅ Found existing customer: {customer.name} ({clean_phone})")
        if customer_name and customer_name.strip():
            if customer.name != customer_name:
                logger.info(f"🔄 Updating customer name from '{customer.name}' to '{customer_name}'")
                customer.name = customer_name
                db_session.add(customer) # Mark for update
    else:
        # 4. If not found, CREATE REAL CUSTOMER
        logger.info(f"🆕 Creating NEW customer: {customer_name} ({clean_phone})")
        customer = models.Customer(
            id=generate_id("cust"),
            tenant_id=tenant_id,
            name=customer_name if customer_name else "Guest", # Default only if AI gave no name
            phone=clean_phone,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(customer)
    
    db_session.flush() # Ensure ID is generated
    return customer