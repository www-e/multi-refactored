# Voice Call System - Critical Analysis

## ACTUAL PROBLEM DISCOVERED

### The Real Issue
The system has a **fundamental architectural flaw**:

1. **Customer is created BEFORE the call** with empty data
2. **Session is marked COMPLETED when user clicks "End Call"**
3. **ElevenLabs webhook is supposed to extract data** - BUT IT'S NOT FIRING!
4. **Result**: Blank customers, no bookings, no tickets, sessions stuck as "ACTIVE"

### Why ElevenLabs Webhook Isn't Working

**Possible Reasons:**
1. **Webhook URL not configured in ElevenLabs dashboard**
2. **Webhook secret mismatch or not set**
3. **ElevenLabs doesn't send webhook for short/test calls**
4. **Network/firewall blocking webhook**
5. **Webhook is async and takes time (not instant)**

### Current Flow (BROKEN)
```
1. User clicks "Start Call"
   → POST /voice/sessions
   → Creates VoiceSession (ACTIVE)
   → Creates Customer (name="", phone="")
   
2. User talks with AI
   → ElevenLabs handles conversation
   → Data collected in ElevenLabs system
   
3. User clicks "End Call"
   → Frontend calls conversation.endSession()
   → Frontend calls POST /voice/sessions/{id}/end
   → Session status = COMPLETED
   → ended_at = now()
   
4. ElevenLabs webhook (SHOULD fire but DOESN'T)
   → POST /voice/post_call
   → Extract customer name, phone, intent
   → Update customer record
   → Create booking/ticket
   → Create call/conversation records
```

### The Problem
**Step 4 never happens!** So we have:
- ✅ Session created
- ✅ Session marked as ended
- ❌ No data extraction
- ❌ No customer update
- ❌ No booking/ticket creation
- ❌ No call record

## SOLUTION: Proactive Data Fetching

Instead of waiting for webhook, we should:
1. **When user ends call**, immediately fetch conversation data from ElevenLabs API
2. **Process the data synchronously** in the end session endpoint
3. **Keep webhook as backup** for cases where frontend doesn't call end

### Implementation Plan

#### Option 1: Fetch on End (RECOMMENDED)
```python
@router.post("/voice/sessions/{session_id}/end")
async def end_voice_session(...):
    # 1. Mark session as ended
    voice_session.status = COMPLETED
    voice_session.ended_at = now()
    db_session.commit()
    
    # 2. Immediately fetch and process conversation data
    try:
        await process_conversation_webhook(db_session, session_id)
    except Exception as e:
        logger.error(f"Failed to process conversation: {e}")
        # Don't fail the endpoint, webhook can retry later
    
    return {"status": "success"}
```

#### Option 2: Background Task
```python
from fastapi import BackgroundTasks

@router.post("/voice/sessions/{session_id}/end")
async def end_voice_session(..., background_tasks: BackgroundTasks):
    # Mark as ended immediately
    voice_session.status = COMPLETED
    
    # Process data in background
    background_tasks.add_task(
        process_conversation_webhook,
        db_session,
        session_id
    )
```

#### Option 3: Polling/Retry System
```python
# Add a status field to VoiceSession
class VoiceSession:
    processing_status: Enum  # pending, processing, completed, failed
    
# Background worker checks for sessions with:
# - status = COMPLETED
# - processing_status = pending
# - ended_at < 1 minute ago
# Then fetches and processes data
```

## Immediate Fixes Needed

### 1. Add Logging to Track Webhook
```python
# In webhook_service.py
logger.info(f"🔔 WEBHOOK RECEIVED for conversation: {conversation_id}")
logger.info(f"📊 Extracted data: name={customer_name}, phone={customer_phone}, intent={intent}")
```

### 2. Don't Create Customer Until We Have Data
```python
# In session_service.py - DON'T create customer at all
# Just store customer_id as None initially
# Create customer only in webhook when we have real data
```

### 3. Add Webhook Status Endpoint
```python
@router.get("/voice/sessions/{session_id}/status")
async def get_session_status(...):
    return {
        "session_status": voice_session.status,
        "has_customer_data": bool(customer.name and customer.phone),
        "has_booking": bool(booking),
        "has_ticket": bool(ticket),
        "webhook_processed": bool(voice_session.summary)
    }
```

### 4. Manual Trigger Endpoint (For Testing)
```python
@router.post("/voice/sessions/{session_id}/process")
async def manually_process_session(...):
    """Manually trigger data extraction for a session"""
    await process_conversation_webhook(db_session, session_id)
    return {"status": "processed"}
```

## How to Debug Production

### Check if Webhook is Configured
1. Log into ElevenLabs dashboard
2. Go to Agent settings
3. Check "Webhook URL" field
4. Should be: `https://your-domain.com/api/voice/post_call`

### Check Backend Logs
```bash
# SSH into production server
ssh user@server

# Check if webhook is being received
docker logs navaia_backend --tail 100 | grep "webhook"
docker logs navaia_backend --tail 100 | grep "WEBHOOK RECEIVED"

# Check for errors
docker logs navaia_backend --tail 100 | grep "ERROR"
```

### Check Database Directly
```bash
# Connect to PostgreSQL
docker exec -it navaia_db psql -U navaia -d navaia

# Check voice sessions
SELECT id, status, created_at, ended_at, conversation_id, summary 
FROM voice_sessions 
ORDER BY created_at DESC 
LIMIT 5;

# Check customers
SELECT id, name, phone, created_at 
FROM customers 
ORDER BY created_at DESC 
LIMIT 5;

# Check bookings
SELECT id, customer_name, phone, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;

# Check if webhook processed anything
SELECT id, summary, extracted_intent 
FROM voice_sessions 
WHERE summary IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test Webhook Manually
```bash
# From your local machine, test if webhook endpoint is accessible
curl -X POST https://your-domain.com/api/voice/post_call \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": "test_123"}'

# Should return error about missing conversation, but proves endpoint is reachable
```

## Next Steps

1. **Check ElevenLabs webhook configuration** (most likely issue)
2. **Add comprehensive logging** to track webhook calls
3. **Implement proactive data fetching** on session end
4. **Add manual processing endpoint** for testing
5. **Don't create blank customers** - wait for real data
