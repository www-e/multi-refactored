# Complete Voice Call System - Testing & Debugging Guide

## Quick Answers to Your Questions

### 1. Are there placeholder values?
**NO** - After the latest fixes:
- Customer is NOT created initially
- Customer is created ONLY when webhook processes the call with real data
- Bookings and tickets are created ONLY after data extraction

### 2. Why is user saved with no name and no phone?
**ROOT CAUSE**: The ElevenLabs webhook is NOT being triggered!
- Session ends → Customer ID is generated but customer record doesn't exist yet
- Webhook should fire → Create customer with real data
- **But webhook isn't firing** → Customer never gets created

### 3. Why does dashboard show "عميل جديد" with running timer?
**Two possibilities**:
1. Session is ACTIVE (call still ongoing)
2. Session is COMPLETED but customer doesn't exist (webhook didn't fire)

The dashboard tries to fetch customer but gets None, so shows "عميل جديد"

### 4. How to check PostgreSQL database in production?

```bash
# SSH into your server
ssh user@your-server-ip

# Connect to PostgreSQL container
docker exec -it navaia_db psql -U navaia -d navaia

# Now you're in PostgreSQL shell, run queries:

-- Check recent voice sessions
SELECT id, status, created_at, ended_at, customer_id, summary, extracted_intent 
FROM voice_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if customers exist
SELECT id, name, phone, created_at 
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- Check bookings
SELECT id, customer_name, phone, project, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- Check tickets
SELECT id, customer_name, phone, issue, created_at 
FROM tickets 
ORDER BY created_at DESC 
LIMIT 10;

-- Check calls
SELECT id, conversation_id, status, outcome, created_at 
FROM calls 
ORDER BY created_at DESC 
LIMIT 10;

-- Exit PostgreSQL
\q
```

### 5. Why are tickets and bookings not created?
**Because the webhook isn't processing!**

The flow is:
1. Call ends → Session marked COMPLETED ✅
2. Webhook fires → Extract data → Create customer → Create booking/ticket ❌ NOT HAPPENING

### 6. Docker/Deploy Configuration
Your setup:
- Backend: Port 8000 (Python/FastAPI)
- Frontend: Port 3001 (Next.js)
- Database: PostgreSQL in Docker
- Auto-deploy via GitHub Actions

### 7. Is frontend displaying correctly?
**Frontend is fine!** The problem is backend - no data to display because webhook isn't processing.

### 8. Console output analysis
The WebSocket errors are normal - they happen when the call ends. Not a problem.

## THE REAL PROBLEM

### ElevenLabs Webhook is NOT Configured or NOT Working

**Evidence:**
1. Customers are blank (no name, no phone)
2. No bookings/tickets created
3. No call history records
4. Sessions show as ACTIVE forever (before cleanup script)

**This means**: The webhook endpoint `/voice/post_call` is NEVER being called by ElevenLabs!

## SOLUTION IMPLEMENTED

### Proactive Data Fetching
Instead of waiting for webhook, we now:
1. **When user clicks "End Call"**:
   - Frontend calls `/voice/sessions/{id}/end`
   - Backend marks session as COMPLETED
   - **Backend immediately fetches conversation data from ElevenLabs API**
   - Backend processes data (create customer, booking/ticket, call records)

2. **Webhook as backup**:
   - If webhook fires later, it will update data
   - But we don't rely on it anymore

## HOW TO TEST

### Test 1: Check if Webhook Endpoint is Reachable

```bash
# From your local machine
curl -X POST https://your-domain.com/api/voice/post_call \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "test_123"}'

# Expected: Error about conversation not found (proves endpoint works)
# Bad: Connection refused or 404 (endpoint not accessible)
```

### Test 2: Check Backend Logs

```bash
# SSH into server
ssh user@server

# Watch backend logs in real-time
docker logs -f navaia_backend

# In another terminal, make a test call
# You should see logs like:
# 🔔 WEBHOOK PROCESSING STARTED for conversation: vs_xxxxx
# 📡 Fetching conversation data from ElevenLabs API...
# ✅ Successfully fetched conversation data
# 📊 EXTRACTED DATA:
#    - Customer Name: علي
#    - Customer Phone: 01154688628
#    - Intent: book_appointment
# ✅ Creating new customer with extracted data
# 📅 Creating booking from conversation...
# ✅ Booking created successfully
# 🎉 WEBHOOK PROCESSING COMPLETED SUCCESSFULLY
```

### Test 3: Manual Webhook Trigger

After making a call, manually trigger processing:

```bash
# Get the session ID from the database
docker exec -it navaia_db psql -U navaia -d navaia -c \
  "SELECT id FROM voice_sessions ORDER BY created_at DESC LIMIT 1;"

# Manually trigger processing (replace SESSION_ID)
curl -X POST https://your-domain.com/api/elevenlabs/conversation/SESSION_ID/process \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Check ElevenLabs Dashboard

1. Log into https://elevenlabs.io
2. Go to your Agent settings
3. Check "Webhook URL" field
4. **Should be**: `https://your-domain.com/api/voice/post_call`
5. **If empty or wrong**: That's why it's not working!

## DEBUGGING CHECKLIST

### ✅ Things to Check:

1. **ElevenLabs Webhook Configuration**
   - [ ] Webhook URL is set in ElevenLabs dashboard
   - [ ] URL is correct: `https://your-domain.com/api/voice/post_call`
   - [ ] Webhook secret is set (optional but recommended)

2. **Backend Accessibility**
   - [ ] Backend is running: `docker ps | grep navaia_backend`
   - [ ] Backend is healthy: `curl http://localhost:8000/healthz`
   - [ ] Webhook endpoint responds: `curl -X POST http://localhost:8000/api/voice/post_call`

3. **Environment Variables**
   - [ ] `ELEVENLABS_API_KEY` is set
   - [ ] `ELEVENLABS_WEBHOOK_SECRET` is set (if using signature verification)
   - [ ] Database connection works

4. **Firewall/Network**
   - [ ] Port 8000 is open to internet (for webhook)
   - [ ] No firewall blocking ElevenLabs IPs
   - [ ] SSL certificate is valid (if using HTTPS)

## EXPECTED BEHAVIOR AFTER FIXES

### When User Makes a Call:

1. **User clicks "Start Call"**
   ```
   → POST /voice/sessions
   → Creates VoiceSession (ACTIVE)
   → customer_id = generated temp ID
   → NO customer record created yet
   ```

2. **User talks with AI**
   ```
   → ElevenLabs handles conversation
   → Data collected in ElevenLabs system
   ```

3. **User clicks "End Call"**
   ```
   → Frontend calls conversation.endSession()
   → Frontend calls POST /voice/sessions/{id}/end
   → Backend marks session as COMPLETED
   → Backend waits 2 seconds
   → Backend fetches conversation from ElevenLabs API
   → Backend extracts: name, phone, intent, etc.
   → Backend creates Customer with real data
   → Backend creates Booking or Ticket
   → Backend creates Call and Conversation records
   ```

4. **Dashboard Updates**
   ```
   → Call disappears from "المكالمات الحالية" (no longer ACTIVE)
   → Call appears in "آخر المكالمات" with customer name
   → Customer shows real name (e.g., "علي")
   → Phone shows real number (e.g., "01154688628")
   ```

### What You Should See in Logs:

```
✅ Voice session vs_xxxxx marked as ended
🔄 Proactively fetching conversation data for vs_xxxxx
🔔 WEBHOOK PROCESSING STARTED for conversation: vs_xxxxx
📡 Fetching conversation data from ElevenLabs API...
✅ Successfully fetched conversation data
📊 EXTRACTED DATA:
   - Customer Name: علي
   - Customer Phone: 01154688628
   - Intent: book_appointment
   - Summary: Ali contacted سقيفة customer service...
✅ Found voice session: vs_xxxxx | Status: COMPLETED
✅ Creating new customer with extracted data: name=علي, phone=01154688628
✅ Updated customer name to 'علي'
✅ Updated customer phone to '01154688628'
🎯 Processing intent: book_appointment
📅 Creating booking from conversation...
✅ Booking created successfully
📝 Creating conversation and call history records...
✅ History records created: conversation=True, call=True
🎉 WEBHOOK PROCESSING COMPLETED SUCCESSFULLY
   - Action: booking
   - Customer: علي
   - Phone: 01154688628
```

## TROUBLESHOOTING

### Problem: No logs appear when call ends
**Solution**: Check if `/voice/sessions/{id}/end` is being called
```bash
# Check frontend code is calling the endpoint
# Check network tab in browser dev tools
```

### Problem: "Failed to fetch conversation from ElevenLabs"
**Solution**: Check ElevenLabs API key
```bash
docker exec navaia_backend env | grep ELEVENLABS_API_KEY
```

### Problem: Customer created but no booking/ticket
**Solution**: Check intent extraction
```bash
# Look for log: "🎯 Processing intent: unknown_intent"
# If intent is unknown, booking/ticket won't be created
```

### Problem: Booking created but customer name is blank
**Solution**: ElevenLabs didn't extract name
```bash
# Look for log: "- Customer Name: (none)"
# AI didn't capture the name in conversation
# Check ElevenLabs agent configuration
```

## NEXT STEPS

1. **Deploy the fixes**:
   ```bash
   git add .
   git commit -m "Fix: Proactive data fetching on call end"
   git push origin main
   ```

2. **Wait for auto-deploy** (GitHub Actions will deploy automatically)

3. **Test with a real call**:
   - Make a call
   - Provide name and phone in conversation
   - End the call
   - Check dashboard - should show real data

4. **Check logs**:
   ```bash
   ssh user@server
   docker logs -f navaia_backend | grep "🔔\|✅\|❌"
   ```

5. **Verify database**:
   ```bash
   docker exec -it navaia_db psql -U navaia -d navaia
   SELECT * FROM customers ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;
   ```

## PRODUCTION DATABASE ACCESS

### Quick Commands:

```bash
# List all tables
docker exec -it navaia_db psql -U navaia -d navaia -c "\dt"

# Count records
docker exec -it navaia_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM voice_sessions;"
docker exec -it navaia_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM customers;"
docker exec -it navaia_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM bookings;"

# Export data to CSV
docker exec -it navaia_db psql -U navaia -d navaia -c "\COPY (SELECT * FROM voice_sessions) TO '/tmp/sessions.csv' CSV HEADER;"

# Backup database
docker exec navaia_db pg_dump -U navaia navaia > backup_$(date +%Y%m%d).sql
```
