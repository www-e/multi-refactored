import asyncio
import sys
import os
import logging
from datetime import datetime

# Add parent directory to path
sys.path.append(os.getcwd())
from app.db import SessionLocal, engine, Base
from app import models
from app.services.voice.webhook_service import process_webhook_payload

logging.basicConfig(level=logging.ERROR) # Only show errors to keep output clean

async def test_ticket_scenarios():
    print("\n🎫 TESTING TICKET LOGIC (Support Agent)\n" + "-"*40)
    
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    scenarios = [
        {
            "name": "High Priority Electrical",
            "payload": {
                "conversation_id": "ticket_test_01",
                "status": "completed",
                "metadata": {"user_id": "vs_mock_1"},
                "analysis": {
                    "data_collection_results": {
                        "phone": {"value": "01154688628"},
                        "extracted_intent": {"value": "raise_ticket"},
                        "customer_name": {"value": "Ali"},
                        "issue": {"value": "Power outage"},
                        "priority": {"value": "high"}, # Should map to TicketPriorityEnum.high
                        "category": {"value": "electricity"}
                    }
                }
            },
            "expected_prio": models.TicketPriorityEnum.high
        },
        {
            "name": "Low Priority Cleaning",
            "payload": {
                "conversation_id": "ticket_test_02",
                "status": "completed",
                "metadata": {"user_id": "vs_mock_2"},
                "analysis": {
                    "data_collection_results": {
                        "phone": {"value": "01154688628"},
                        "extracted_intent": {"value": "raise_ticket"},
                        "customer_name": {"value": "Ali"},
                        "issue": {"value": "Need cleaning"},
                        "priority": {"value": "low"} # Should map to TicketPriorityEnum.low
                    }
                }
            },
            "expected_prio": models.TicketPriorityEnum.low
        }
    ]

    for scenario in scenarios:
        print(f"   ▶️  Running Scenario: {scenario['name']}...")
        # Mock fetch inside the loop
        import app.services.voice.webhook_service as webhook_module
        webhook_module.fetch_conversation_from_elevenlabs = lambda *args: scenario['payload']
        
        await process_webhook_payload(db, {"conversation_id": scenario['payload']['conversation_id']})
        
        # Verify
        ticket = db.query(models.Ticket).filter(models.Ticket.issue == scenario['payload']['analysis']['data_collection_results']['issue']['value']).first()
        
        if ticket and ticket.priority == scenario['expected_prio']:
            print(f"      ✅ PASS: Priority mapped to {ticket.priority}")
        else:
            print(f"      ❌ FAIL: Expected {scenario['expected_prio']}, got {ticket.priority if ticket else 'None'}")

    db.close()

if __name__ == "__main__":
    asyncio.run(test_ticket_scenarios())