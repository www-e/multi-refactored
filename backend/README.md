# Agentic Navaia - Backend (FastAPI)

This directory contains the complete backend service for the Agentic Navaia portal, built with FastAPI and SQLAlchemy.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development](#local-development)
- [Database Migrations](#database-migrations)
- [API Endpoints](#api-endpoints)
- [ElevenLabs Webhook Configuration](#elevenlabs-webhook-configuration)
- [Health Check](#health-check)

## Prerequisites

Before running this backend service, ensure you have the following installed:

- Python 3.8 or higher
- Virtual environment tool (venv)
- PostgreSQL database
- ngrok (for webhook testing)

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Create virtual environment
   python -m venv .venv

   # Activate virtual environment (Linux/macOS)
   source .venv/bin/activate

   # Activate virtual environment (Windows PowerShell)
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update database connection strings and API keys as needed

## Local Development

### Running the Server

Start the development server with auto-reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base URL:** http://localhost:8000
- **Interactive Documentation:** http://localhost:8000/docs
- **ReDoc Documentation:** http://localhost:8000/redoc

### Development Features

- Auto-reload on code changes
- Interactive API documentation via Swagger UI
- Automatic request validation
- Type hints and runtime validation

## Database Migrations

This project uses Alembic to manage database schema changes.

### Apply Migrations

To apply the latest migrations and create tables:

```bash
alembic upgrade head
```

### Generate New Migration

After making changes to `models.py`, generate a new migration:

```bash
alembic revision --autogenerate -m "Your descriptive message here"
```

### Migration Best Practices

- Always review generated migrations before applying
- Use descriptive migration messages
- Test migrations on a copy of production data
- Keep migrations small and focused

## API Endpoints

### Authentication
- `POST /auth/register` - Create a new user
- `POST /auth/token` - Log in a user and get a JWT token

### Dashboard
- `GET /dashboard/kpis` - Retrieve all dashboard statistics

### Resource Management
- `GET /customers` - List all customers
- `POST /customers` - Create a new customer
- `GET /tickets` - List all tickets
- `POST /tickets` - Create a new ticket
- `GET /bookings` - List all bookings
- `POST /bookings` - Create a new booking
- `GET /campaigns` - List all campaigns
- `POST /campaigns` - Create a new campaign

### Voice & AI Integration
- `POST /elevenlabs/conversation/{conversation_id}/process` - Webhook receiver for ElevenLabs post-call data

## ElevenLabs Webhook Configuration

For AI automation and voice conversation processing, configure ElevenLabs webhook integration.

### Setup Steps

1. **Start your backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 8000
   ```

3. **Construct the webhook URL:**
   - Copy the HTTPS forwarding URL from ngrok terminal (e.g., `https://<random-string>.ngrok-free.app`)
   - Append the endpoint path: `/elevenlabs/conversation/{conversation_id}/process`
   - Final URL example: `https://<random-string>.ngrok-free.app/elevenlabs/conversation/{conversation_id}/process`

4. **Configure in ElevenLabs Dashboard:**
   - Navigate to your agent's settings
   - Under "Post-call webhook", paste the final URL
   - Ensure the method is set to `POST`

### Webhook Security

- Webhooks include signature validation
- Ensure ngrok tunnel remains active during testing
- Use HTTPS URLs for production deployment

## Health Check

Monitor service health:

```bash
curl http://localhost:8000/healthz
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T00:05:18.972Z"
}
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change port: `uvicorn app.main:app --reload --port 8001`

2. **Database connection errors:**
   - Verify PostgreSQL is running
   - Check connection string in `.env`
   - Ensure database exists

3. **Import errors:**
   - Verify virtual environment is activated
   - Install dependencies: `pip install -r requirements.txt`

4. **Migration errors:**
   - Ensure Alembic is properly configured
   - Check database schema compatibility
   - Review migration logs

### Logs

View application logs in the terminal where uvicorn is running. For production, configure proper logging to files or external services.

---

For more information about FastAPI, visit the [official documentation](https://fastapi.tiangolo.com/).