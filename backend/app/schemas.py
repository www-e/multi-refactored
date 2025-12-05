# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Any, Union

# --- Base Models ---
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    # Fix: Added neighborhoods to Schema so frontend receives it
    neighborhoods: Optional[Union[List[str], Any]] = None

# --- Create Model (from API) ---
class CustomerCreate(CustomerBase):
    pass

# --- Update Model (from API) ---
class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    neighborhoods: Optional[List[str]] = None

# --- Read Model (to API) ---
class Customer(CustomerBase):
    id: str
    created_at: datetime
    tenant_id: str

    class Config:
        from_attributes = True # Replaces orm_mode = True