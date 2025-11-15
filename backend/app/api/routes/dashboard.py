# backend/app/api/routes/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api import deps

router = APIRouter()

@router.get("/dashboard/kpis")
def get_dashboard_kpis(_=Depends(deps.get_current_user), db_session: Session = Depends(deps.get_session)):
    """
    Get dashboard KPIs calculated from the database
    """
    from sqlalchemy import func

    total_calls = db_session.query(models.VoiceSession).count()
    completed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED
    ).count()
    answer_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
    total_bookings = db_session.query(models.Booking).count()
    conversion_rate = (total_bookings / total_calls * 100) if total_calls > 0 else 0
    total_revenue = db_session.query(func.sum(models.Booking.price_sar)).scalar() or 0
    avg_duration_hours = 0
    avg_handle_time = int(avg_duration_hours * 3600)
    csat = 4.2
    missed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.FAILED
    ).count()
    ai_transferred = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.extracted_intent.isnot(None)
    ).count()
    roas = total_revenue / 200000 if total_revenue else 0
    current_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.ACTIVE
    ).limit(5).all()

    current_calls_formatted = [
        {"id": call.id, "customerName": call.customer_id, "duration": "00:00", "status": "وارد"}
        for call in current_calls
    ]

    recent_tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(5).all()
    ai_transferred_chats = [
        {"id": ticket.id, "customerName": ticket.customer_name or "Unknown", "reason": "طلب معلومات مفصلة", "waitingTime": "00:00"}
        for ticket in recent_tickets[:2]
    ]

    kpis = {
        "totalCalls": total_calls, "answerRate": round(answer_rate, 1),
        "conversionToBooking": round(conversion_rate, 1), "revenue": int(total_revenue),
        "roas": round(roas, 1), "avgHandleTime": avg_handle_time, "csat": csat,
        "missedCalls": missed_calls, "aiTransferred": ai_transferred,
        "systemStatus": "AI_يعمل", "totalCallsChange": 0, "answerRateChange": 0,
        "conversionChange": 0, "revenueChange": 0, "roasChange": 0.1,
        "avgHandleTimeChange": -15, "csatChange": 0.2, "monthlyTarget": 2000000,
        "qualifiedCount": db_session.query(models.Ticket).filter(models.Ticket.status != models.TicketStatusEnum.open).count()
    }

    live_ops = {
        "currentCalls": current_calls_formatted,
        "aiTransferredChats": ai_transferred_chats
    }

    return {"kpis": kpis, "liveOps": live_ops}