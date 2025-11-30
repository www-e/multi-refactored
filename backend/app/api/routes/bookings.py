# backend/app/api/routes/bookings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models
from app.api import deps
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

def generate_id(prefix: str = "bk") -> str:
    import secrets
    return f"{prefix}_{secrets.token_hex(8)}"

class BookingCreateRequest(BaseModel):
    customerId: str
    propertyCode: str
    startDate: datetime
    price: float
    source: models.ChannelEnum

class BookingStatusUpdateRequest(BaseModel):
    status: models.BookingStatusEnum

class BookingUpdateRequest(BaseModel):
    propertyCode: Optional[str] = None
    startDate: Optional[datetime] = None
    price: Optional[float] = None
    assignee: Optional[str] = None

from datetime import datetime, timezone

def format_booking(b: models.Booking):
    weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    day_name = weekday_map[b.preferred_datetime.weekday()] if b.preferred_datetime else ""
    return {
        "id": b.id,
        "customerId": b.customer_id,
        "customerName": b.customer_name,
        "phone": b.phone,
        "project": b.project,
        "appointmentDate": b.start_date.isoformat() if b.start_date else None,
        "appointmentTime": b.preferred_datetime.strftime("%H:%M") if b.preferred_datetime else None,
        "dayName": day_name,
        "status": b.status.value if b.status else "pending",
        "price": b.price_sar,
        "source": b.source.value,
        "createdBy": b.created_by.value,
        "createdAt": b.created_at.isoformat(),
        "propertyId": b.property_code
    }

@router.post("/bookings", status_code=201)
def create_booking(booking_in: BookingCreateRequest, tenant_id: str = Depends(deps.get_current_tenant_id), db_session: Session = Depends(deps.get_session), _=Depends(deps.get_current_user)):
    customer = db_session.query(models.Customer).filter(models.Customer.id == booking_in.customerId).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_booking = models.Booking(
        id=generate_id(),
        tenant_id=tenant_id,
        customer_id=customer.id,
        customer_name=customer.name,
        phone=customer.phone,
        property_code=booking_in.propertyCode,
        project=booking_in.propertyCode, # Using code as project name for simplicity
        start_date=booking_in.startDate,
        preferred_datetime=booking_in.startDate,
        price_sar=booking_in.price,
        source=booking_in.source,
        status=models.BookingStatusEnum.pending,
        created_by=models.AIOrHumanEnum.Human, # Manual creation is by a Human
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(db_booking)
    db_session.commit()
    db_session.refresh(db_booking)
    return format_booking(db_booking)

@router.get("/bookings", response_model=List[dict])
def get_bookings(tenant_id: str = Depends(deps.get_current_tenant_id), _=Depends(deps.get_current_user), limit: int = 50, db_session: Session = Depends(deps.get_session)):
    bookings = db_session.query(models.Booking).filter(models.Booking.tenant_id == tenant_id).order_by(models.Booking.created_at.desc()).limit(limit).all()
    return [format_booking(b) for b in bookings]

@router.get("/bookings/recent", response_model=List[dict])
def get_recent_bookings(tenant_id: str = Depends(deps.get_current_tenant_id), _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    bookings = db_session.query(models.Booking).filter(models.Booking.tenant_id == tenant_id).order_by(models.Booking.created_at.desc()).limit(10).all()
    return [format_booking(b) for b in bookings]

@router.patch("/bookings/{booking_id}")
def update_booking_status(booking_id: str, body: BookingStatusUpdateRequest, tenant_id: str = Depends(deps.get_current_tenant_id), _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id, models.Booking.tenant_id == tenant_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = body.status
    db_session.commit()
    db_session.refresh(booking)
    return {"message": "Booking status updated successfully", "id": booking.id, "new_status": booking.status.value}

@router.patch("/bookings/{booking_id}/general")
def update_booking_general(
    booking_id: str,
    booking_in: BookingUpdateRequest,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db_session: Session = Depends(deps.get_session)
):
    """
    Update booking general information (excluding status which has its own endpoint).
    """
    booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id, models.Booking.tenant_id == tenant_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Update only provided fields
    update_data = booking_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "propertyCode":
            booking.property_code = value
            booking.project = value  # Also update the project field
        elif field == "startDate":
            booking.start_date = value
            booking.preferred_datetime = value  # Also update preferred datetime
        elif hasattr(booking, field):
            setattr(booking, field, value)

    db_session.commit()
    db_session.refresh(booking)
    return format_booking(booking)

@router.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: str,
    tenant_id: str = Depends(deps.get_current_tenant_id),
    _=Depends(deps.get_current_user),
    db_session: Session = Depends(deps.get_session)
):
    """
    Delete a booking.
    """
    booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id, models.Booking.tenant_id == tenant_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check if booking has related approvals
    has_approvals = db_session.query(models.Approval).filter(
        models.Approval.entity_type == "booking",
        models.Approval.entity_id == booking_id
    ).first()

    if has_approvals:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete booking with existing approvals. Consider canceling instead.",
        )

    db_session.delete(booking)
    db_session.commit()
    return {"message": "Booking deleted successfully"}