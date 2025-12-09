from datetime import datetime, timedelta
import math
from fastapi import APIRouter, Depends
from sqlalchemy import func, case, distinct
from sqlalchemy.orm import Session
from app import models
from app.api import deps

router = APIRouter()

@router.get("/dashboard/kpis")
def get_dashboard_kpis(
    tenant_id: str = Depends(deps.get_current_tenant_id), 
    _: models.User = Depends(deps.get_current_user), 
    db: Session = Depends(deps.get_session)
):
    # --- HELPER: Date Ranges ---
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    # --- 1. CORE METRICS (Absolute) ---
    
    # Total Calls (Voice Sessions)
    total_calls = db.query(models.VoiceSession).filter(
        models.VoiceSession.tenant_id == tenant_id
    ).count()

    # Completed Calls
    completed_calls = db.query(models.VoiceSession).filter(
        models.VoiceSession.tenant_id == tenant_id,
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED
    ).count()

    # Answer Rate
    answer_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0.0

    # Bookings & Conversion
    total_bookings = db.query(models.Booking).filter(
        models.Booking.tenant_id == tenant_id
    ).count()
    conversion_rate = (total_bookings / total_calls * 100) if total_calls > 0 else 0.0

    # Revenue
    total_revenue = db.query(func.sum(models.Booking.price_sar)).filter(
        models.Booking.tenant_id == tenant_id
    ).scalar() or 0.0

    # ROAS (Revenue / Estimated Cost). 
    # Assumption: Cost per call is ~1 SAR (Twilio/LLM costs). Real cost logic can be added later.
    estimated_cost = total_calls * 1.5 
    roas = (total_revenue / estimated_cost) if estimated_cost > 0 else 0.0

    # Average Handle Time (Duration of calls)
    # We calculate difference between ended_at and created_at for completed sessions
    avg_duration = db.query(
        func.avg(
            func.extract('epoch', models.VoiceSession.ended_at) - 
            func.extract('epoch', models.VoiceSession.created_at)
        )
    ).filter(
        models.VoiceSession.tenant_id == tenant_id,
        models.VoiceSession.status == models.VoiceSessionStatus.COMPLETED,
        models.VoiceSession.ended_at.isnot(None)
    ).scalar() or 0

    # CSAT (Sentiment Analysis Proxy)
    # If sentiment is 'positive' -> 5, 'neutral' -> 3, 'negative' -> 1
    # This converts text sentiment to a number
    sentiment_score = db.query(
        func.avg(
            case(
                (models.Conversation.sentiment == 'positive', 5),
                (models.Conversation.sentiment == 'neutral', 3),
                (models.Conversation.sentiment == 'negative', 1),
                else_=0
            )
        )
    ).filter(
        models.Conversation.tenant_id == tenant_id,
        models.Conversation.sentiment.isnot(None)
    ).scalar() or 0.0

    # Missed Calls (Failed/Abandoned)
    missed_calls = db.query(models.VoiceSession).filter(
        models.VoiceSession.tenant_id == tenant_id,
        models.VoiceSession.status == models.VoiceSessionStatus.FAILED
    ).count()

    # AI Transferred (Intents detected)
    ai_transferred = db.query(models.VoiceSession).filter(
        models.VoiceSession.tenant_id == tenant_id,
        models.VoiceSession.extracted_intent.isnot(None)
    ).count()

    # --- 2. TRENDS (Current vs Previous 30 Days) ---
    
    def get_count_in_range(model, start, end):
        return db.query(model).filter(
            model.tenant_id == tenant_id,
            model.created_at >= start,
            model.created_at < end
        ).count()

    curr_calls = get_count_in_range(models.VoiceSession, thirty_days_ago, now)
    prev_calls = get_count_in_range(models.VoiceSession, sixty_days_ago, thirty_days_ago)
    calls_change = ((curr_calls - prev_calls) / prev_calls * 100) if prev_calls > 0 else 0.0

    curr_rev = db.query(func.sum(models.Booking.price_sar)).filter(
        models.Booking.tenant_id == tenant_id,
        models.Booking.created_at >= thirty_days_ago
    ).scalar() or 0.0
    prev_rev = db.query(func.sum(models.Booking.price_sar)).filter(
        models.Booking.tenant_id == tenant_id,
        models.Booking.created_at >= sixty_days_ago,
        models.Booking.created_at < thirty_days_ago
    ).scalar() or 0.0
    revenue_change = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0.0

    # --- 3. LIVE OPS (Active Sessions) ---
    active_sessions = db.query(models.VoiceSession).filter(
        models.VoiceSession.tenant_id == tenant_id,
        models.VoiceSession.status == models.VoiceSessionStatus.ACTIVE
    ).order_by(models.VoiceSession.created_at.desc()).limit(5).all()

    formatted_active_calls = []
    for s in active_sessions:
        # Calculate real-time duration
        duration_sec = (datetime.utcnow() - s.created_at).total_seconds()
        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        
        # Resolve Name
        display_name = s.customer_phone or "Connecting..."
        if s.customer_id:
            c = db.query(models.Customer).filter(models.Customer.id == s.customer_id).first()
            if c and c.name: display_name = c.name
            
        formatted_active_calls.append({
            "id": s.id,
            "customerName": display_name,
            "duration": f"{mins:02d}:{secs:02d}",
            "status": "connected"
        })

    # Recent Tickets
    recent_tickets = db.query(models.Ticket).filter(
        models.Ticket.tenant_id == tenant_id
    ).order_by(models.Ticket.created_at.desc()).limit(5).all()

    formatted_tickets = [
        {
            "id": t.id,
            "customerName": t.customer_name or t.phone or "Unknown",
            "reason": t.issue or t.category,
            "waitingTime": t.created_at.strftime("%H:%M")
        }
        for t in recent_tickets
    ]

    return {
        "kpis": {
            "totalCalls": total_calls,
            "answerRate": round(answer_rate, 1),
            "conversionToBooking": round(conversion_rate, 1),
            "revenue": int(total_revenue),
            "roas": round(roas, 1),
            "avgHandleTime": int(avg_duration),
            "csat": round(sentiment_score, 1),
            "missedCalls": missed_calls,
            "aiTransferred": ai_transferred,
            "systemStatus": "AI_يعمل",
            # Trends
            "totalCallsChange": round(calls_change, 1),
            "revenueChange": round(revenue_change, 1),
            "answerRateChange": 0, # Implement if needed
            "conversionChange": 0, # Implement if needed
            "roasChange": 0,
            "avgHandleTimeChange": 0,
            "csatChange": 0,
            "monthlyTarget": 50000, # This can remain a static target or be moved to settings
            "qualifiedCount": ai_transferred
        },
        "liveOps": {
            "currentCalls": formatted_active_calls,
            "aiTransferredChats": formatted_tickets
        }
    }