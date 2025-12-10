import asyncio
import sys
import os
sys.path.append(os.getcwd())
from app.db import SessionLocal, engine, Base
from app import models
from app.services.voice.webhook_service import process_webhook_payload

async def test_robustness():
    print("\n🛡️ TESTING SYSTEM ROBUSTNESS (Edge Cases)\n" + "-"*40)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Case 1: Missing Intent (Should fallback based on data presence)
    print("   ▶️  Case 1: Missing Intent...")
    payload_no_intent = {
        "conversation_id": "robust_1",
        "metadata": {},
        "analysis": {
            "data_collection_results": {
                "phone": {"value": "0119999999"},
                "customer_name": {"value": "Mystery Man"},
                "issue": {"value": "My sink is broken"} # Implies Ticket
                # No extracted_intent
            }
        }
    }
    
    import app.services.voice.webhook_service as webhook_module
    webhook_module.fetch_conversation_from_elevenlabs = lambda *args: payload_no_intent
    
    await process_webhook_payload(db, {"conversation_id": "robust_1"})
    
    ticket = db.query(models.Ticket).filter(models.Ticket.issue == "My sink is broken").first()
    if ticket:
        print("      ✅ PASS: Fallback created Ticket based on 'issue' field.")
    else:
        print("      ❌ FAIL: Fallback logic failed.")

    # Case 2: Saudi Phone Format
    print("   ▶️  Case 2: Saudi Phone (+966)...")
    payload_saudi = payload_no_intent.copy()
    payload_saudi['analysis']['data_collection_results']['phone']['value'] = "0551234567"
    
    await process_webhook_payload(db, {"conversation_id": "robust_2"})
    
    cust = db.query(models.Customer).filter(models.Customer.phone == "+966551234567").first()
    if cust:
        print("      ✅ PASS: Phone normalized to +966551234567")
    else:
        print("      ❌ FAIL: Saudi phone normalization failed.")

    db.close()

if __name__ == "__main__":
    asyncio.run(test_robustness())