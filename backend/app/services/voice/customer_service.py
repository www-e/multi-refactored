import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models
import secrets

logger = logging.getLogger(__name__)

def generate_id() -> str:
    return f"cust_{secrets.token_hex(8)}"

def upsert_customer(
    db_session: Session,
    customer_phone: str,
    customer_name: str = None,
    tenant_id: str = "demo-tenant"
) -> models.Customer:
    if not customer_phone or not customer_phone.strip():
        customer_phone = "UNKNOWN_PHONE"

    customer = db_session.query(models.Customer).filter(
        models.Customer.phone == customer_phone,
        models.Customer.tenant_id == tenant_id
    ).first()

    if customer:
        if customer_name and customer_name.strip():
            if customer.name != customer_name:
                customer.name = customer_name
                db_session.add(customer)
    else:
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