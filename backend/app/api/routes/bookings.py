# backend/app/api/routes/bookings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import models
from app.api import deps
from pydantic import BaseModel

router = APIRouter()

class BookingStatusUpdateRequest(BaseModel):
    status: models.BookingStatusEnum

@router.get("/bookings", response_model=List[dict])
def get_bookings(_=Depends(deps.get_current_user), limit: int = 50, db_session: Session = Depends(deps.get_session)):
    bookings = db_session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(limit).all()
    # This logic can be simplified in the future, but for now, we keep it as is.
    result = []
    for booking in bookings:
        weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        day_name = weekday_map[booking.preferred_datetime.weekday()] if booking.preferred_datetime else ""
        result.append({
            "id": booking.id, "customer_name": booking.customer_name, "phone": booking.phone,
            "project": booking.project, "appointment_date": booking.start_date.isoformat() if booking.start_date else None,
            "appointment_time": booking.preferred_datetime.strftime("%H:%M") if booking.preferred_datetime else None,
            "day_name": day_name, "status": booking.status.value if booking.status else "pending",
        })
    return result

@router.get("/bookings/recent", response_model=List[dict])
def get_recent_bookings(_=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    bookings = db_session.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(10).all()
    result = []
    for booking in bookings:
        weekday_map = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        day_name = weekday_map[booking.preferred_datetime.weekday()] if booking.preferred_datetime else ""
        result.append({
            "id": booking.id, "customer_name": booking.customer_name, "phone": booking.phone,
            "project": booking.project, "appointment_date": booking.start_date.isoformat() if booking.start_date else None,
            "appointment_time": booking.preferred_datetime.strftime("%H:%M") if booking.preferred_datetime else None,
            "day_name": day_name, "status": booking.status.value if booking.status else "pending",
        })
    return result

@router.patch("/bookings/{booking_id}")
def update_booking_status(booking_id: str, body: BookingStatusUpdateRequest, _=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    booking = db_session.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = body.status
    db_session.commit()
    db_session.refresh(booking)
    return {"message": "Booking status updated successfully", "id": booking.id, "new_status": booking.status.value}