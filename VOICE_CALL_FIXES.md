# Voice Call System Fixes - Summary

## Issues Fixed

### 1. **Dashboard Not Detecting Call End**
**Problem:** Calls remained in "المكالمات الحالية" (Current Calls) section forever, showing incorrect durations like 76:12 or 24:12.

**Root Cause:** 
- Voice sessions were created with status `ACTIVE` but never updated to `COMPLETED` when the call ended
- The webhook processing wasn't being triggered properly due to async/await issues
- No mechanism to mark sessions as ended when user disconnects

**Fixes Applied:**
- ✅ Made `process_conversation_webhook` and `process_webhook_payload` async functions
- ✅ Updated all webhook endpoints to properly await async functions
- ✅ Added new endpoint `/voice/sessions/{session_id}/end` to immediately mark sessions as completed
- ✅ Updated frontend `useVoiceAgent.ts` to call the end endpoint when user stops the session
- ✅ Created cleanup script `cleanup_ghost_calls.py` to fix existing stuck calls

### 2. **"Unknown Customer" and "N/A" Phone Numbers**
**Problem:** All calls showed "Unknown Customer" as the customer name and "N/A" as phone number, even after data was extracted from the call.

**Root Cause:**
- Initial customer creation used placeholder values ("Unknown Customer", "N/A")
- Webhook extraction was working but the update logic was too strict and filtered out valid names
- Arabic names were being incorrectly identified as placeholders

**Fixes Applied:**
- ✅ Changed initial customer creation to use empty strings instead of placeholders
- ✅ Improved webhook customer update logic to properly handle Arabic names
- ✅ Updated the name validation to only skip obvious English placeholders
- ✅ Modified dashboard to fetch actual customer names from the Customer table
- ✅ Updated action_service to use actual customer data instead of placeholders

### 3. **Data Not Being Extracted or Saved**
**Problem:** Call data wasn't being extracted from ElevenLabs and saved to the Calls page.

**Root Cause:**
- The async `fetch_conversation_from_elevenlabs` function was being called synchronously
- This caused the webhook processing to fail silently
- No error handling to catch these failures

**Fixes Applied:**
- ✅ Fixed all async/await issues in the webhook processing chain
- ✅ Ensured proper error logging throughout the webhook flow
- ✅ Verified that `create_call_from_voice_session` and `create_conversation_from_voice_session` are called after data extraction

## Code Changes Summary

### Backend Files Modified:
1. **`backend/app/services/voice/webhook_service.py`**
   - Made `process_conversation_webhook` async
   - Made `process_webhook_payload` async
   - Improved customer name update logic to handle Arabic names
   - Added better logging for customer updates

2. **`backend/app/api/routes/voice.py`**
   - Updated endpoints to await async webhook functions
   - Added new `/voice/sessions/{session_id}/end` endpoint

3. **`backend/app/services/voice/session_service.py`**
   - Removed "Unknown Customer" placeholder from initial creation
   - Changed to use empty string instead

4. **`backend/app/services/voice/customer_service.py`**
   - Changed default customer name from "Unknown Customer" to empty string
   - Changed default phone from "N/A" to empty string

5. **`backend/app/services/voice/action_service.py`**
   - Updated booking and ticket creation to use actual customer data
   - Removed "Unknown Customer" and "N/A" fallbacks

6. **`backend/app/api/routes/dashboard.py`**
   - Updated current calls query to fetch actual customer names from Customer table
   - Added fallback to show phone number if name is empty
   - Default to "عميل جديد" (New Customer) if both are empty

### Frontend Files Modified:
1. **`src/hooks/useVoiceAgent.ts`**
   - Added call to `/voice/sessions/{session_id}/end` when stopping session
   - Ensures sessions are marked as completed immediately

### New Files Created:
1. **`backend/scripts/cleanup_ghost_calls.py`**
   - Script to clean up existing ghost calls (ACTIVE sessions older than 10 minutes)
   - Can be run manually to fix existing data

## How to Apply These Fixes

### 1. Clean Up Existing Ghost Calls
Run the cleanup script to fix existing stuck calls:
```bash
cd backend
python scripts/cleanup_ghost_calls.py
```

### 2. Restart Backend Server
The backend changes require a server restart:
```bash
cd backend
# Stop the current server (Ctrl+C)
# Restart it
uvicorn app.main:app --reload
```

### 3. Restart Frontend
The frontend changes require a rebuild:
```bash
cd ..
npm run dev
```

### 4. Test the Fixes
1. Start a new voice call
2. Have a conversation with the AI
3. End the call
4. Verify:
   - Call disappears from "المكالمات الحالية" immediately
   - Customer name is extracted and displayed (not "Unknown Customer")
   - Phone number is extracted and displayed (not "N/A")
   - Call appears in the Calls page with proper data

## Expected Behavior After Fixes

### During Call:
- Call appears in "المكالمات الحالية" with status ACTIVE
- Duration counter shows accurate time
- Customer shows as "عميل جديد" initially

### After Call Ends:
- Call immediately disappears from "المكالمات الحالية"
- Session status changes to COMPLETED
- Webhook processes the call data
- Customer name and phone are extracted from AI conversation
- Customer record is updated with real data
- Call record is created with proper outcome (booked/ticket/info)
- Call appears in Calls page with all extracted data

### Data Extraction:
Based on the example in `elevenlabsextracted.md`:
- ✅ Customer name: "علي" (Ali)
- ✅ Phone: "01154688628"
- ✅ Intent: "book_appointment"
- ✅ Project: "سقيفة 28"
- ✅ Preferred datetime: "2025-12-16T14:00:00+00:00"
- ✅ Issue: "مشكلة الكهرباء"
- ✅ Priority: "high"

All this data should now be properly extracted and saved to the database.

## Monitoring and Debugging

### Check Webhook Logs:
```bash
# In backend terminal, watch for these log messages:
# "Received webhook for conversation: {conversation_id}"
# "Updated customer name from '...' to '...'"
# "Updated customer phone to '...'"
# "Creating conversation and call history records"
```

### Check Database:
```sql
-- Check for ghost calls (should be none after cleanup)
SELECT id, created_at, ended_at, status 
FROM voice_sessions 
WHERE status = 'ACTIVE' 
AND created_at < NOW() - INTERVAL '10 minutes';

-- Check customer data
SELECT id, name, phone 
FROM customers 
WHERE name != '' OR phone != '';
```

## Notes

- The webhook from ElevenLabs may take a few seconds to arrive after the call ends
- The frontend immediately marks the session as ended to prevent ghost calls
- The webhook then processes the full conversation data and updates everything
- If webhook fails, the session is still marked as ended (no ghost calls)
- Customer data is only updated if new data is available (no overwriting with placeholders)
