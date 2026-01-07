

### **Terminal 2: Backend Server**
```bash
# Navigate to backend directory
cd D:\RAKAN\newagenticnavaia\Agentic-Navaia\backend

# Activate virtual environment (if using one)
# Windows:
.\venv\Scripts\Activate.ps1
# Or if you created it with different name:

# Install backend dependencies
pip install -r requirements.txt

# for initialization
alembic revision --autogenerate -m "Initial migration"

# Run database migrations (ONE TIME SETUP) (if u deleted the db file)
alembic upgrade head

# Run backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend will run on**: `http://localhost:8000`
- **Auto-reload enabled**

# Enter the backend container
docker exec -it navaia_backend /bin/bash

# Inside the container, run:
alembic revision --autogenerate -m "Sync customer schema"
alembic upgrade head



# Check logs
docker logs -f agentic_portal_backend --tail 100 & docker logs -f agentic_portal_frontend --tail 100

# Check Docker containers
docker ps -a | grep agentic

# Truncate database tables
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "TRUNCATE TABLE bookings, voice_sessions, customers , tickets RESTART IDENTITY CASCADE;"

# Verify tables are empty
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM customers;"
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM voice_sessions;"
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM bookings;"
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM tickets;"
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "SELECT COUNT(*) FROM users;"


# live watch
docker logs -f agentic_portal_backend --tail 150
docker logs -f agentic_portal_frontend --tail 100



# changing all users to specfici tenant
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "UPDATE users SET tenant_id = 'demo-tenant';"



# truncate all tables except users
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "TRUNCATE TABLE alembic_version, approvals, bookings, calls, campaign_metrics, campaigns, conversations, customers, events, handoffs, messages, organizations, tickets, voice_sessions RESTART IDENTITY CASCADE;"


# list all tables
docker exec -it agentic_portal_db psql -U navaia -d navaia -c "\dt"



# seed admin creds
docker exec -it agentic_portal_backend python -m scripts.seed_admin
docker-compose exec agentic_backend python -m scripts.seed_admin