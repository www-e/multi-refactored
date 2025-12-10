import asyncio
import sys
import os
from datetime import datetime, timedelta
# Add parent directory to path
sys.path.append(os.getcwd())
from app.db import SessionLocal, engine, Base
from app import models
from app.services.voice.webhook_service import process_webhook_payload

async def test_booking_scenarios():
    print("\n📅 TESTING BOOKING LOGIC (Sales Agent)\n" + "-"*40)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    scenarios = [
        {
            "name": "Standard ISO Date",
            "date_input": "2025-12-25T15:00:00+00:00",
            "should_pass": True
        },
        {
            "name": "Short Date String",
            "date_input": "2025-12-25",
            "should_pass": True # Parser should add T10:00:00
        },
        {
            "name": "Garbage Date (Fallback Test)",
            "date_input": "Next Friday afternoon",
            "should_pass": True # Should fallback to Tomorrow 10am, NOT CRASH
        }
    ]

    for i, scen in enumerate(scenarios):
        conv_id = f"booking_test_{i}"
        print(f"   ▶️  Running Scenario: {scen['name']} (Input: '{scen['date_input']}')")
        
        payload = {
            "conversation_id": conv_id,
            "metadata": {"user_id": f"vs_mock_b_{i}"},
            "analysis": {
                "data_collection_results": {
                    "phone": {"value": "01154688628"},
                    "extracted_intent": {"value": "book_appointment"},
                    "customer_name": {"value": "Ali"},
                    "preferred_datetime": {"value": scen['date_input']}
                }
            }
        }

        import app.services.voice.webhook_service as webhook_module
        webhook_module.fetch_conversation_from_elevenlabs = lambda *args: payload
        
        await process_webhook_payload(db, {"conversation_id": conv_id})
        
        booking = db.query(models.Booking).order_by(models.Booking.created_at.desc()).first()
        
        if booking:
            print(f"      ✅ PASS: Booking created at {booking.start_date}")
        else:
            print(f"      ❌ FAIL: No booking created.")

    db.close()

if __name__ == "__main__":
    asyncio.run(test_booking_scenarios())