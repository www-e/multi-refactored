# backend/app/api/api.py
from fastapi import APIRouter
from app.api.routes import auth, dashboard, bookings, tickets, voice, customers, campaigns

api_router = APIRouter()

# Include all the new routers
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(bookings.router, tags=["Bookings"])
api_router.include_router(tickets.router, tags=["Tickets"])
api_router.include_router(voice.router, tags=["Voice & ElevenLabs"])
api_router.include_router(customers.router, tags=["Customers"])
api_router.include_router(campaigns.router, tags=["Campaigns"])