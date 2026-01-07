# backend/app/api/api.py
from fastapi import APIRouter
from app.api.routes import auth, dashboard, bookings, tickets, voice, customers, campaigns, calls, conversations, voice_sessions, transcripts, admin_users, twilio

api_router = APIRouter()

# Include all the new routers
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(bookings.router, tags=["Bookings"])
api_router.include_router(tickets.router, tags=["Tickets"])
api_router.include_router(voice.router, tags=["Voice & ElevenLabs"])
api_router.include_router(customers.router, tags=["Customers"])
api_router.include_router(campaigns.router, tags=["Campaigns"])
api_router.include_router(calls.router, tags=["Calls"])
api_router.include_router(conversations.router, tags=["Conversations"])
api_router.include_router(voice_sessions.router, tags=["Voice Sessions"])
api_router.include_router(transcripts.router, tags=["Transcripts"])
api_router.include_router(admin_users.router, tags=["Admin Users"], prefix="/admin")
api_router.include_router(twilio.router, tags=["Twilio"])
