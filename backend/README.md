## Navaia Backend (FastAPI)

### Local Development

Run with uvicorn:

```bash
cd backend
source .venv312/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Setup

Using Docker compose at repo root:

```bash
# from repo root
docker compose up --build -d
# API at http://localhost:8000
# Swagger at http://localhost:8000/docs
```

### ElevenLabs Webhook Setup

1. **Start ngrok tunnel:**
```bash
ngrok http 8000
```

2. **Configure ElevenLabs webhook:**
   - URL: `https://<ngrok-subdomain>.ngrok-free.app/voice/post_call`
   - Auth: HMAC with `ELEVENLABS_WEBHOOK_SECRET` from .env

3. **Test webhook:**
   - In ElevenLabs dashboard: Post-Call Webhook → "Send test"
   - Should return 200 OK
   - Check data with: `curl http://localhost:8000/voice_sessions`

### Webhook Endpoints

- `POST /voice/post_call` - Receives ElevenLabs post-call webhooks
- `GET /voice_sessions` - List recent voice sessions
- `GET /tickets` - List recent tickets  
- `GET /bookings` - List recent bookings

Environment variables:
- `ELEVENLABS_WEBHOOK_SECRET` - Required for webhook HMAC verification
- `TENANT_ID` - Default: "demo-tenant"
- `DB_URL` - Database connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET`

- `ELEVENLABS_HMAC_SECRET`
- `TENANT_ID`

Healthcheck:
```bash
curl http://localhost:8000/healthz
``` 