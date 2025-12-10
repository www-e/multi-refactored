import asyncio
import sys
import os
import logging
from datetime import datetime, timezone

# 1. Setup Environment
sys.path.append(os.getcwd())
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("SYSTEM_TEST")

# 2. Mock Data (The EXACT payload from your real logs)
MOCK_ELEVENLABS_PAYLOAD = {
    "conversation_id": "conv_PRODUCTION_SIM_01", 
    "status": "completed",
    "metadata": {
        "user_id": "", # Will be filled dynamically
        "call_duration_secs": 120
    },
    "analysis": {
        "transcript_summary": "Ali called about electrical issues.",
        "data_collection_results": {
            "preferred_datetime": { "value": "2025-12-16T14:00:00+00:00" },
            "phone": { "value": "01154688628" }, # Egyptian format
            "extracted_intent": { "value": "book_appointment" }, # Logic should handle both ticket & booking if data present
            "customer_name": { "value": "Ali" },
            "project": { "value": "سقيفة 28" },
            "issue": { "value": "مشكلة الكهرباء" },
            "priority": { "value": "high" } # Should map to Enum.high
        }
    }
}

async def run_forensic_audit():
    print("\n🕵️ STARTING FORENSIC SYSTEM AUDIT\n" + "="*50)

    try:
        from app.db import SessionLocal, engine, Base
        from app import models
        from app.services.voice.session_service import create_voice_session
        from app.services.voice.webhook_service import process_webhook_payload
        
        # 3. Clean Slate
        print("🛠️  Resetting Local Database...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()

        # --- STEP 1: FRONTEND SESSION ---
        print("\n[STEP 1] Simulating Frontend Call Start...")
        session = create_voice_session(
            db_session=db,
            agent_type="support",
            customer_id=None,
            tenant_id="prod-tenant-01",
            customer_phone=None 
        )
        print(f"   ✅ Session Created: {session.id}")

        # --- STEP 2: WEBHOOK EXECUTION ---
        print("\n[STEP 2] Executing Webhook Logic...")
        
        # Inject Session ID
        payload = MOCK_ELEVENLABS_PAYLOAD.copy()
        payload['metadata']['user_id'] = session.id
        
        # Mock API Fetch
        import app.services.voice.webhook_service as webhook_module
        async def mock_fetch(*args): return payload
        webhook_module.fetch_conversation_from_elevenlabs = mock_fetch

        # Run Logic
        result = await process_webhook_payload(db, {"conversation_id": "conv_PRODUCTION_SIM_01"})
        print(f"   ✅ Logic Result: {result}")

        # --- STEP 3: FORENSIC DATA CHECK ---
        print("\n[STEP 3] deep Data Inspection...")
        
        # 3.1 Customer Identity
        # Expected: +20... (Egypt code added, leading 0 removed)
        expected_phone = "+201154688628" 
        customer = db.query(models.Customer).filter(models.Customer.phone == expected_phone).first()
        
        if customer:
            print(f"   ✅ Customer Identity: MATCH ({customer.name}, {customer.phone})")
        else:
            print(f"   ❌ Customer Identity: FAILED. Expected {expected_phone}")
            # Debug: what is in DB?
            all_c = db.query(models.Customer).all()
            print(f"      -> Found in DB: {[c.phone for c in all_c]}")
            return

        # 3.2 Booking Precision
        booking = db.query(models.Booking).filter(models.Booking.customer_id == customer.id).first()
        if booking:
            # Date Check
            iso_date = booking.start_date.isoformat()
            if "2025-12-16T14:00:00" in iso_date:
                print(f"   ✅ Booking Date: EXACT MATCH ({iso_date})")
            else:
                print(f"   ❌ Booking Date: MISMATCH. Got {iso_date}")
            
            # Project Check
            if booking.project == "سقيفة 28":
                print(f"   ✅ Booking Project: EXACT MATCH ({booking.project})")
            else:
                print(f"   ❌ Booking Project: MISMATCH. Got {booking.project}")
        else:
            print("   ❌ Booking Record: MISSING")

        # 3.3 Ticket Logic (Since 'issue' and 'priority' were present, did it create a ticket too?)
        # Our logic: Intent was "book_appointment", but we have fallback/parallel creation logic?
        # Let's check if 'create_full_interaction_record' handles extracting multiple items.
        # Based on current code: It creates based on Intent. 
        # Since intent was "book_appointment", it might NOT have created a ticket unless we check that logic.
        # Let's check anyway.
        
        ticket = db.query(models.Ticket).filter(models.Ticket.customer_id == customer.id).first()
        if ticket:
            print(f"   ℹ️  Ticket was also created (Hybrid Logic).")
            # Priority Check
            if ticket.priority == models.TicketPriorityEnum.high:
                print(f"   ✅ Ticket Priority: EXACT MATCH (High)")
            else:
                print(f"   ❌ Ticket Priority: MISMATCH. Got {ticket.priority}")
        else:
            print(f"   ℹ️  No Ticket created (Expected if Intent was purely 'book_appointment')")

        # --- STEP 4: GHOST SESSION FALLBACK ---
        print("\n[STEP 4] Testing Ghost Session Resilience...")
        ghost_payload = payload.copy()
        ghost_payload['metadata']['user_id'] = "vs_GHOST_999" # Invalid ID
        ghost_payload['analysis']['data_collection_results']['phone']['value'] = "0501234567" # Saudi
        ghost_payload['analysis']['data_collection_results']['customer_name']['value'] = "Ghost User"
        
        await process_webhook_payload(db, {"conversation_id": "conv_GHOST_REC"})
        
        ghost_cust = db.query(models.Customer).filter(models.Customer.phone == "+966501234567").first()
        if ghost_cust:
            print(f"   ✅ Ghost Session: RECOVERED. Created customer {ghost_cust.phone}")
        else:
            print(f"   ❌ Ghost Session: FAILED.")

    except Exception as e:
        print(f"\n❌ AUDIT FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("\n" + "="*50)

if __name__ == "__main__":
    asyncio.run(run_forensic_audit())