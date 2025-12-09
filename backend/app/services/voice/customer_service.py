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
    
    clean_phone = customer_phone.strip() if customer_phone else ""
    if not clean_phone:
        clean_phone = "0000000000"

    # Search by phone
    customer = db_session.query(models.Customer).filter(
        models.Customer.phone == clean_phone,
        models.Customer.tenant_id == tenant_id
    ).first()

    if customer:
        logger.info(f"✅ Found customer: {customer.name}")
        # Update name if we found a better one
        if customer_name and customer_name.strip() and customer_name != "Voice User":
            if customer.name != customer_name:
                logger.info(f"🔄 Updating name: {customer.name} -> {customer_name}")
                customer.name = customer_name
                db_session.add(customer)
    else:
        logger.info(f"🆕 Creating customer: {customer_name}")
        customer = models.Customer(
            id=generate_id("cust"),
            tenant_id=tenant_id,
            name=customer_name if customer_name else "Voice User",
            phone=clean_phone,
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(customer)
    
    db_session.flush()
    return customer