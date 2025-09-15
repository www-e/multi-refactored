# NAVAIA Backend & Database Setup Guide

**Tech Stack:** FastAPI + SQLite(dev)/PostgreSQL(prod) + Redis + SQLAlchemy + JWT + ElevenLabs

## 🚀 Quick Setup

### Prerequisites
- Python 3.12+
- Docker & Docker Compose (for production)
- ElevenLabs API account

### Database Schema
```
customers → conversations → messages
customers → voice_sessions, bookings, tickets
campaigns, events (logging)
```

## Development Setup

```bash
# 1. Setup Python environment
cd Voice_agent_portal/backend
python -m venv .venv312
source .venv312/bin/activate  # macOS/Linux
# .venv312\Scripts\activate    # Windows
pip install -r requirements.txt

# 2. Create .env file
cat > .env << EOF
DB_URL=sqlite:///dev.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-super-secret-jwt-key
ELEVENLABS_HMAC_SECRET=your-elevenlabs-secret
TENANT_ID=demo-tenant
EOF

# 3. Run server
python -m app.main
# OR: uvicorn app.main:app --reload

# 4. Verify
curl http://localhost:8000/healthz  # {"status": "ok"}
# Docs: http://localhost:8000/docs
```

## Production Setup (Docker)

```bash
# From root directory
docker-compose up -d

# Verify
curl http://localhost:8000/healthz
docker-compose ps
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | ✅ | `sqlite:///dev.db` | Database connection |
| `REDIS_URL` | ✅ | `redis://localhost:6379/0` | Redis connection |
| `JWT_SECRET` | ✅ | - | JWT signing key |
| `ELEVENLABS_HMAC_SECRET` | ✅ | - | ElevenLabs webhook secret |
| `TENANT_ID` | ✅ | `demo-tenant` | Multi-tenant ID |

**Database URLs:**
- SQLite: `sqlite:///dev.db`
- PostgreSQL: `postgresql://navaia:navaia@localhost:5432/navaia`

## API Endpoints

```http
GET  /healthz                 # Health check
POST /voice/sessions         # Create voice session  
POST /elevenlabs/webhook     # ElevenLabs webhook
GET  /customers              # List customers
POST /customers              # Create customer
```

## Core Database Models

```python
# Main tables with key fields
customers: id, tenant_id, name, phone, email, budget, neighborhoods
voice_sessions: id, customer_id, direction, status, locale  
conversations: id, customer_id, channel, summary, sentiment
messages: conversation_id, role, text, timestamp
bookings: customer_id, property_code, status, price_sar
tickets: customer_id, priority, category, status
```

## Testing

```bash
# Health check
curl http://localhost:8000/healthz

# Create voice session
curl -X POST http://localhost:8000/voice/sessions \
  -H "Content-Type: application/json" \
  -d '{"agent_type":"support","customer_id":"test-123"}'

# Use project tasks
npm run test-health-endpoints
npm run test-voice-session
```

## Troubleshooting

**Database Connection:**
```bash
# SQLite: Check file exists
ls -la backend/dev.db

# PostgreSQL: Check containers
docker-compose ps
```

**Import Errors:**
```bash
source backend/.venv312/bin/activate
pip install -r backend/requirements.txt
```

**Port in Use:**
```bash
# Find & kill process on port 8000
lsof -i :8000
kill -9 <PID>
```

**Reset Database:**
```bash
# Development (SQLite)
rm backend/dev.db && python -m app.main

# Production (PostgreSQL)
docker-compose down -v && docker-compose up -d
```

## Key Files

**Config:** `/backend/app/config.py`, `/backend/app/db.py`  
**Models:** `/backend/app/models.py`  
**Main:** `/backend/app/main.py`  
**Docker:** `/docker-compose.yml`  
**Logs:** `/backend/backend.log`, `/logs/elevenlabs.log`

---
**Setup Complete!** 🚀 Use `http://localhost:8000/docs` for API documentation.
