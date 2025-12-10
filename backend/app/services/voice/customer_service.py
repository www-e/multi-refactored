import logging
import secrets
import re
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional
from app import models

logger = logging.getLogger(__name__)

def generate_id(prefix: str = "cust") -> str:
    return f"{prefix}_{secrets.token_hex(8)}"

def normalize_phone_number(phone: str) -> str:
    """
    Standardizes phone numbers to International format (+20, +966).
    """
    if not phone: 
        return ""
        
    # Remove spaces, dashes, parentheses
    clean = re.sub(r'[\s\-\(\)]', '', phone.strip())
    
    # Already international
    if clean.startswith('+'): 
        return clean
        
    # Egypt Handling (01X... -> +201X...)
    if clean.startswith('0020'): 
        return '+' + clean[2:]
    if clean.startswith('01') and len(clean) == 11: 
        return '+20' + clean[1:] # ✅ FIX: Drop the leading '0'
        
    # Saudi Handling (05X... -> +9665X...)
    if clean.startswith('966'): 
        return '+' + clean
    if clean.startswith('05') and len(clean) == 10: 
        return '+966' + clean[1:] # Drop the leading '0'
        
    # Fallback: Just add plus if it looks like digits
    if clean.isdigit(): 
        return '+' + clean
        
    return clean

def upsert_customer(db: Session, phone: str, name: Optional[str], tenant_id: str) -> models.Customer:
    """
    Finds existing customer or creates a new one.
    Crucial: Ensures we always have a valid Customer object for bookings.
    """
    # 1. Handle missing phone scenarios
    if not phone:
        phone = f"UNKNOWN_{secrets.token_hex(4)}"
        
    normalized = normalize_phone_number(phone)
    
    # 2. Lookup
    customer = db.query(models.Customer).filter(
        models.Customer.phone == normalized,
        models.Customer.tenant_id == tenant_id
    ).first()
    
    # 3. Update Existing
    if customer:
        if name and name.strip() and customer.name != name:
            logger.info(f"📝 Updating Name: {customer.name} -> {name}")
            customer.name = name
            db.add(customer)
        return customer
    
    # 4. Create New
    new_customer = models.Customer(
        id=generate_id(),
        tenant_id=tenant_id,
        name=name or "New Customer",
        phone=normalized,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_customer)
    db.flush() 
    
    logger.info(f"🆕 Created Customer: {new_customer.name} ({normalized})")
    return new_customer