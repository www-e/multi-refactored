#  Railway Setup Guide - Voice Agent Webhook

##  What's Already Done
- Backend deployed to Railway: https://railway-for-webhook-elevenlabs-production.up.railway.app
- ElevenLabs webhook configured and working
- Database ready to receive calls
- All secrets configured

##  Quick Commands for Testing

### 1. Check if Backend is Running (No Login Required)
bash
curl https://railway-for-webhook-elevenlabs-production.up.railway.app/healthz

*Expected:* {"status":"healthy","db_connection":"ok","timestamp":"..."}

### 2. View Real-Time Webhook Logs (Optional - Requires Railway Access)
bash
cd backend
railway login  # Ask to invite you to Railway project first(Not neccesary)
railway logs

*What to look for:* Lines showing POST /voice/post_call 200 OK

*Note:* If you don't have Railway access, skip this step and use database checks instead (see step 3).

### 3. Check Database for New Conversations
bash
cd backend
sqlite3 dev.db "SELECT conversation_id, customer_phone, extracted_intent, created_at FROM voice_sessions ORDER BY created_at DESC LIMIT 5;"


### 4. Make a Test Call
- *What to say:* "I want to book an appointment" or "I need support"
- *Wait:* Hang up and wait 10-20 seconds for webhook

### 5. Verify Webhook Received Data
bash
# Check logs immediately after call
railway logs --tail 20

# Check database for new entry
sqlite3 dev.db "SELECT conversation_id, customer_phone, extracted_intent, created_at FROM voice_sessions WHERE created_at > datetime('now', '-5 minutes');"


##  Troubleshooting Commands

### View Last 50 Log Lines
bash
railway logs --tail 50


### Check All Environment Variables
bash
railway variables --json


### Check Database Connection
bash
sqlite3 dev.db ".tables"  # Should show: customers, voice_sessions, etc.


### Test Webhook Endpoint (Should Get Signature Error)
bash
curl -X POST https://railway-for-webhook-elevenlabs-production.up.railway.app/voice/post_call

*Expected:* {"detail":"Missing signature header"} ← This means endpoint is working!