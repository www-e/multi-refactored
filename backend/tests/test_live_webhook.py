import requests
import json
import time
import hmac
import hashlib

# ================= CONFIGURATION =================
# 1. Put your REAL Secret here (from ElevenLabs Dashboard)
WEBHOOK_SECRET = "wsec_8c9ca7878dd835518a8184be874cb05d9836c21ff2edfb3b800905d9b2a0f36b" 

# 2. Your Live URL
TARGET_URL = "https://agentic.navaia.sa/voice/post_call"
# =================================================

def run_live_test():
    print(f"🚀 Launching Live Webhook Test against: {TARGET_URL}")

    # 1. Create the Payload (Matches your Data Collection)
    payload = {
        "conversation_id": f"test_hmac_{int(time.time())}",
        "status": "completed",
        "metadata": {
            "user_id": "vs_manual_test", # Simulating a session ID
            "call_duration_secs": 12
        },
        "analysis": {
            "data_collection_results": {
                "phone": { "value": "01154688628" },
                "extracted_intent": { "value": "book_appointment" },
                "customer_name": { "value": "HMAC Tester" },
                "preferred_datetime": { "value": "2025-12-20T10:00:00+00:00" },
                "project": { "value": "HMAC Verification Project" }
            }
        }
    }
    
    body_bytes = json.dumps(payload).encode("utf-8")
    timestamp = str(int(time.time()))

    # 2. Calculate HMAC Signature (Exactly how ElevenLabs does it)
    # Signature = HMAC_SHA256(timestamp . body)
    message = f"{timestamp}.{body_bytes.decode('utf-8')}"
    signature = hmac.new(
        key=WEBHOOK_SECRET.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()

    # 3. Construct Headers
    headers = {
        "Content-Type": "application/json",
        "Elevenlabs-Signature": f"t={timestamp},v1={signature}"
    }

    # 4. Send Request
    try:
        print("📨 Sending Request...")
        response = requests.post(TARGET_URL, data=body_bytes, headers=headers)
        
        print("\n" + "="*40)
        print(f"STATUS CODE: {response.status_code}")
        print("="*40)
        
        if response.status_code == 200:
            print("✅ SUCCESS! The server accepted the signature.")
            print(f"Response: {response.text}")
            print("\nCheck your Dashboard > Bookings. You should see 'HMAC Tester'.")
        else:
            print("❌ FAILED. The server rejected the request.")
            print(f"Response: {response.text}")
            if response.status_code == 500:
                print("👉 Check Server Logs: 'docker logs agentic_portal_backend --tail 50'")
            elif "Signature" in response.text:
                print("👉 HMAC Mismatch! Your secret in .env does not match the script.")

    except Exception as e:
        print(f"❌ CONNECTION ERROR: {e}")

if __name__ == "__main__":
    run_live_test()