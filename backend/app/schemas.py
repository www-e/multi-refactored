# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# --- Base Models ---
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None

# --- Create Model (from API) ---
class CustomerCreate(CustomerBase):
    pass

# --- Read Model (to API) ---
class Customer(CustomerBase):
    id: str
    created_at: datetime
    tenant_id: str

    class Config:
        from_attributes = True # Replaces orm_mode = True