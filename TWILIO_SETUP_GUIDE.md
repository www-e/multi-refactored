# Twilio Outbound Calling Setup Guide

## 📱 Understanding Phone Numbers

### Two Different Numbers, Two Different Purposes

**IMPORTANT**: You need TWO different phone numbers for this system:

1. **Twilio Phone Number** (`TWILIO_PHONE_NUMBER`)
   - **Purpose**: Initiates outbound calls to customers
   - **Your Current Number**: +1 938 336 2295 (currently in ElevenLabs)
   - **Role**: This is the "caller ID" customers see when AI calls them
   - **Action Required**: Port or configure this number in Twilio
   - **Provider**: Twilio

2. **ElevenLabs Phone Number** (`ELEVENLABS_PHONE_NUMBER`)
   - **Purpose**: Receives forwarded calls and connects to AI agent
   - **Role**: Where Twilio forwards the call after customer answers
   - **Current Setup**: Already configured in your ElevenLabs account
   - **Provider**: ElevenLabs

### The Complete Flow

```
┌─────────────────┐
│ Your System     │
│ (Backend)       │
└────────┬────────┘
         │
         │ 1. Initiates call
         ▼
┌─────────────────┐
│   Twilio        │
│   +1 938...     │  ← Calls customer
└────────┬────────┘
         │
         │ 2. Customer answers
         ▼
┌─────────────────┐
│   Twilio        │
│   Webhook       │  ← Gets instructions
└────────┬────────┘
         │
         │ 3. Forwards call
         ▼
┌─────────────────┐
│  ElevenLabs     │
│  Phone Number   │  ← Connects to M7sen AI
└────────┬────────┘
         │
         │ 4. Conversation happens
         ▼
┌─────────────────┐
│  ElevenLabs     │
│  Webhook        │  ← Sends transcript & data
└────────┬────────┘
         │
         │ 5. Processes data
         ▼
┌─────────────────┐
│  Your Database  │  ← Creates bookings/tickets
└─────────────────┘
```

---

## 🚀 Step-by-Step Twilio Setup

### Step 1: Create Twilio Account

1. Go to https://www.twilio.com
2. Click "Sign Up" or "Log In"
3. Verify your email address
4. Verify your phone number

**Account Type**: Choose "Developer Account" or "Standard Account"

### Step 2: Get Your Twilio Phone Number

**Option A**: Use Your Existing Number (+1 938 336 2295)
1. In Twilio Console, go to "Phone Numbers" → "Manage" → "Buy a Number"
2. Click "Port a Number" (to port your existing number)
3. Follow the porting process (takes 1-3 weeks)
4. OR: Buy a new temporary number for testing

**Option B**: Buy a New Twilio Number
1. In Twilio Console, go to "Phone Numbers" → "Manage" → "Buy a Number"
2. Select country (United States)
3. Choose capabilities: **Voice** (required)
4. Pick a number
5. Click "Buy" ($1/month)

### Step 3: Get Your Credentials

1. In Twilio Console, go to "Settings" → "General Settings"
2. Copy these values:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click "Show" to reveal)

**Save these securely!** You'll need them for environment variables.

### Step 4: Create a TwiML Application

A TwiML Application tells Twilio what to do when calls are made.

1. Go to "Twilio" → "Explore" → "Twiml Apps"
2. Click "Create TwiML App"
3. Fill in the form:
   - **Friendly Name**: "Agentic Navaia Voice Agent"
   - **Voice Request URL**: `https://agentic.navaia.sa/api/twilio/connect/{session_id}`
   - **Voice Method**: POST
   - **Voice Fallback URL**: (optional) `https://agentic.navaia.sa/api/twilio/error`
4. Click "Save"

**Copy the TwiML App SID** (starts with `AP`) 

### Step 5: Configure Your Twilio Phone Number

1. Go to "Phone Numbers" → "Active Numbers"
2. Click on your number (+1 938 336 2295)
3. Scroll down to "Voice & Fax"
4. Configure:
   - **A call comes in**: Select "Webhook"
   - **Webhook URL**: `https://agentic.navaia.sa/api/twilio/connect/{session_id}`
   - **Method**: POST
5. Under "Voice Configuration"
   - **Status Callback URL**: `https://agentic.navaia.sa/api/twilio/status/{session_id}`
   - **Status Callback Method**: POST
6. Click "Save"

### Step 6: Configure Webhook URLs (CRITICAL!)

Your backend must be publicly accessible for Twilio to reach it.

**For Production**:
- Deploy your backend to a server with a public IP
- Use a domain name with SSL (HTTPS is required by Twilio)
- Configure your firewall to allow Twilio's IPs

---

## 🔧 Environment Configuration

### Add to Backend `.env` File

```bash
# =================================================================
# TWILIO CONFIGURATION
# =================================================================

# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx  # From Twilio Console
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx     # From Twilio Console (keep secret!)

# Twilio Phone Number (the number that calls customers)
# This is the number customers will see on their caller ID
TWILIO_PHONE_NUMBER=+19383362295

# ElevenLabs Phone Number (where Twilio forwards the call)
# This is your ElevenLabs agent's phone number
ELEVENLABS_PHONE_NUMBER=+1xxxxxxxxxx

# Your Backend API URL (for webhooks)
# For local development, use ngrok URL
# For production, use your actual domain
API_URL=https://your-domain.com
# Or for local:
# API_URL=https://abc123.ngrok-free.app
```

### Verify Environment Variables

After adding the variables, verify they're loaded:

```python
# In Python backend
import os
print(f"Twilio SID: {os.getenv('TWILIO_ACCOUNT_SID')}")
print(f"Twilio Number: {os.getenv('TWILIO_PHONE_NUMBER')}")
print(f"ElevenLabs Number: {os.getenv('ELEVENLABS_PHONE_NUMBER')}")
print(f"API URL: {os.getenv('API_URL')}")
```

---

## 🎯 Testing Your Setup

### Test 1: Verify Backend Configuration

```bash
# Start backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Check health
curl http://localhost:8000/healthz

# Check Twilio health
curl http://localhost:8000/api/twilio/health
```

Expected response:
```json
{
  "status": "ok",
  "elevenlabs_number_configured": true,
  "elevenlabs_number": "+1xxxxxxxxxx"
}
```

### Test 2: Test TwiML Generation

```bash
# Test TwiML endpoint
curl -X POST http://localhost:8000/api/twilio/test
```

Expected response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello, this is a test call from the system.</Say>
  <Hangup/>
</Response>
```

### Test 3: Make a Test Outbound Call

Using the API or frontend:

```bash
# Via API
curl -X POST http://localhost:8000/api/calls/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_id": "test_customer_123",
    "phone": "+1234567890",
    "agent_type": "support"
  }'
```

What should happen:
1. Backend creates VoiceSession
2. Twilio calls the phone number
3. When answered, Twilio connects to ElevenLabs
4. M7sen agent speaks with customer
5. After call ends, ElevenLabs webhook processes data
6. Database updated with transcript, intent, etc.

---

## 🐛 Troubleshooting

### Issue: "Twilio not configured" Error

**Solution**:
1. Check backend logs: `Twilio not configured - creating session only (simulation mode)`
2. Verify environment variables are set in `.env`
3. Restart backend after adding `.env` variables
4. Check variables are loaded: `print(os.getenv('TWILIO_ACCOUNT_SID'))`

### Issue: Webhook Not Reaching Backend

**Solution**:
1. Ensure backend is publicly accessible (use ngrok for local)
2. Check firewall allows inbound traffic
3. Verify Twilio webhook URL is correct (starts with https://)
4. Check backend logs for incoming webhook requests
5. Test webhook URL: `curl https://your-domain.com/api/twilio/health`

### Issue: Call Connects But No Audio

**Solution**:
1. Verify ELEVENLABS_PHONE_NUMBER is correct
2. Check ElevenLabs agent is active
3. Test ElevenLabs number directly (call it from your phone)
4. Check Twilio call logs in Twilio Console
5. Verify session_id is being passed correctly

### Issue: Call Ends Immediately

**Solution**:
1. Check phone number format (must be E.164: +1234567890)
2. Verify Twilio account has credits
3. Check number is not on a blocklist
4. Review Twilio error logs in Console

### Issue: Webhook Signature Verification Fails

**Solution**:
1. For development: System will still process webhook (logs warning)
2. For production: Ensure ELEVENLABS_WEBHOOK_SECRET matches
3. Check webhook is sent from ElevenLabs, not Twilio

---

## 📊 Monitoring & Logging

### Backend Logs to Watch

```python
# Successful outbound call initiation
📞 Initiating outbound call to customer {id} at {phone}
✅ VoiceSession created: vs_xxx
✅ Twilio call initiated: SID=CAxxx

# Twilio webhook received
📞 Twilio connect webhook received for session: vs_xxx
✅ Found voice session: vs_xxx, agent: support
📞 Returning TwiML to dial ElevenLabs: +1xxx

# Call status updates
📞 Call status update: SID=CAxxx, Status=ringing, Session=vs_xxx
✅ Call answered for session vs_xxx

# ElevenLabs webhook (after call ends)
📡 WEBHOOK RECEIVED: /voice/post_call
✅ Session vs_xxx completed successfully
```

### Twilio Console Monitoring

1. Go to "Monitor" → "Logs" in Twilio Console
2. Filter by: "Voice Calls"
3. Look for:
   - Call initiation
   - Call status (ringing, in-progress, completed, failed)
   - Any errors or warnings

### Database Checks

```sql
-- Check voice sessions
SELECT id, status, agent_name, customer_phone, created_at 
FROM voice_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check calls
SELECT c.id, c.direction, c.status, c.created_at,
       vs.agent_name, vs.extracted_intent
FROM calls c
LEFT JOIN voice_sessions vs ON c.conversation_id = vs.conversation_id
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## ✅ Configuration Checklist

### Twilio Console
- [ ] Account created
- [ ] Phone number purchased or ported (+1 938 336 2295)
- [ ] Account SID & Auth Token obtained
- [ ] TwiML Application created
- [ ] Voice URLs configured
- [ ] Status callback URL configured
- [ ] All changes saved

### Backend Environment
- [ ] TWILIO_ACCOUNT_SID set
- [ ] TWILIO_AUTH_TOKEN set
- [ ] TWILIO_PHONE_NUMBER set
- [ ] ELEVENLABS_PHONE_NUMBER set
- [ ] API_URL set (ngrok or production)
- [ ] Backend restarted after changes
- [ ] Variables verified in logs

### Network Configuration
- [ ] Backend accessible from internet (ngrok/server)
- [ ] HTTPS enabled (required by Twilio)
- [ ] Firewall allows Twilio IPs
- [ ] Webhook URLs tested and accessible

### Testing
- [ ] Health check endpoint works
- [ ] TwiML generation tested
- [ ] Test outbound call made
- [ ] Call connected to ElevenLabs
- [ ] Conversation completed
- [ ] Webhook received
- [ ] Database records created
- [ ] Transcript accessible

---

## 🎓 Next Steps

After completing this setup:

1. **Test with Real Customers**: Start with a small test group
2. **Monitor Performance**: Track call success rates, duration, costs
3. **Optimize Prompt**: Improve ElevenLabs agent responses
4. **Scale Gradually**: Increase call volume as you gain confidence
5. **Set Alerts**: Monitor for failed calls or errors

---

## 📞 Support & Resources

- **Twilio Docs**: https://www.twilio.com/docs/voice/tutorials/automated-survey
- **Twilio Support**: https://support.twilio.com
- **ElevenLabs Docs**: https://elevenlabs.io/docs
- **Project Repository**: Your GitHub repo

---

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Rotate Auth Tokens** periodically (every 90 days)
3. **Use Environment Variables** in production, never hardcode
4. **Monitor Call Costs** to prevent abuse
5. **Implement Rate Limiting** for outbound calls
6. **Validate Phone Numbers** to prevent harassment
7. **Keep Webhooks Secure** with signature verification

---

**Last Updated**: 2025-01-07
**Version**: 1.0.0
**Status**: Ready for Implementation
