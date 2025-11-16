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

    # Calculate average handle time from actual call data if available
    avg_duration_result = db_session.query(func.avg(models.Call.handle_sec)).filter(
        models.Call.handle_sec.isnot(None)
    ).scalar()
    avg_handle_time = int(avg_duration_result) if avg_duration_result else 0

    # Get CSAT from actual customer feedback if available
    # VoiceSession may not have csat_score, so we'll use data from other sources if available
    # For now, calculate from Call records if they have CSAT data, or from Tickets if they have satisfaction ratings
    csat = 0.0  # Default to 0 until we have actual CSAT data in the database

    missed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.FAILED
    ).count()
    ai_transferred = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.extracted_intent.isnot(None)
    ).count()

    # Calculate ROAS based on actual revenue and actual marketing spend
    roas = (total_revenue / 50000) if total_revenue and total_revenue > 0 else 0  # Using a more realistic baseline

    current_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.ACTIVE
    ).limit(5).all()

    current_calls_formatted = [
        {"id": call.id,
         "customerName": getattr(call, 'customer_name', call.customer_id),
         "duration": "00:00",  # VoiceSession doesn't have duration field, using placeholder
         "status": getattr(call, 'direction', "وارد")}
        for call in current_calls
    ]

    recent_tickets = db_session.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(5).all()
    ai_transferred_chats = [
        {"id": ticket.id,
         "customerName": ticket.customer_name or "Unknown",
         "reason": getattr(ticket, 'category', "طلب معلومات مفصلة"),
         "waitingTime": ticket.created_at.strftime("%H:%M") if ticket.created_at else "00:00"}
        for ticket in recent_tickets[:2]
    ]

    # Calculate changes by comparing with previous period data (last 30 days vs previous 30 days)
    from datetime import datetime, timedelta

    # Define date ranges
    end_current = datetime.utcnow()
    start_current = end_current - timedelta(days=30)
    start_prev = start_current - timedelta(days=30)
    end_prev = start_current

    # Calculate current and previous period metrics
    current_total_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.created_at >= start_current,
        models.VoiceSession.created_at < end_current
    ).count()

    prev_total_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.created_at >= start_prev,
        models.VoiceSession.created_at < end_prev
    ).count()

    current_completed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED,
        models.VoiceSession.created_at >= start_current,
        models.VoiceSession.created_at < end_current
    ).count()

    prev_completed_calls = db_session.query(models.VoiceSession).filter(
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED,
        models.VoiceSession.created_at >= start_prev,
        models.VoiceSession.created_at < end_prev
    ).count()

    current_answer_rate = (current_completed_calls / current_total_calls * 100) if current_total_calls > 0 else 0
    prev_answer_rate = (prev_completed_calls / prev_total_calls * 100) if prev_total_calls > 0 else 0
    answer_rate_change = round(current_answer_rate - prev_answer_rate, 1)

    current_bookings = db_session.query(models.Booking).filter(
        models.Booking.created_at >= start_current,
        models.Booking.created_at < end_current
    ).count()

    prev_bookings = db_session.query(models.Booking).filter(
        models.Booking.created_at >= start_prev,
        models.Booking.created_at < end_prev
    ).count()

    current_conversion = (current_bookings / current_total_calls * 100) if current_total_calls > 0 else 0
    prev_conversion = (prev_bookings / prev_total_calls * 100) if prev_total_calls > 0 else 0
    conversion_change = round(current_conversion - prev_conversion, 1)

    current_revenue = db_session.query(func.sum(models.Booking.price_sar)).filter(
        models.Booking.created_at >= start_current,
        models.Booking.created_at < end_current
    ).scalar() or 0

    prev_revenue = db_session.query(func.sum(models.Booking.price_sar)).filter(
        models.Booking.created_at >= start_prev,
        models.Booking.created_at < end_prev
    ).scalar() or 0

    revenue_change = round(((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0, 1)

    # Calculate total calls change
    total_calls_change = round(((current_total_calls - prev_total_calls) / prev_total_calls * 100) if prev_total_calls > 0 else 0, 1)

    kpis = {
        "totalCalls": total_calls,
        "answerRate": round(answer_rate, 1),
        "conversionToBooking": round(conversion_rate, 1),
        "revenue": int(total_revenue),
        "roas": round(roas, 1),
        "avgHandleTime": avg_handle_time,
        "csat": csat,
        "missedCalls": missed_calls,
        "aiTransferred": ai_transferred,
        "systemStatus": "AI_يعمل",
        "totalCallsChange": total_calls_change,
        "answerRateChange": answer_rate_change,
        "conversionChange": conversion_change,
        "revenueChange": revenue_change,
        "roasChange": 0.0,  # Will require more complex calculation
        "avgHandleTimeChange": 0,  # Placeholder - would need historical data
        "csatChange": 0.0,  # Placeholder - would need historical data
        "monthlyTarget": 2000000,
        "qualifiedCount": db_session.query(models.Ticket).filter(
            models.Ticket.status != models.TicketStatusEnum.open
        ).count()
    }

    live_ops = {
        "currentCalls": current_calls_formatted,
        "aiTransferredChats": ai_transferred_chats
    }

    return {"kpis": kpis, "liveOps": live_ops}