# 🚀 Agentic Navaia - Complete Startup Guide

## 📋 Prerequisites

- **Node.js** (v18+) - for frontend
- **Python 3.11** - for backend 
- **SQLite** (usually comes with Python)
- **ngrok** (for external access) - optional

## 🛠️ Step-by-Step Startup Guide

### **Terminal 1: Frontend Server**
```bash
# Navigate to project root
cd D:\RAKAN\newagenticnavaia\Agentic-Navaia

# Install frontend dependencies
npm install

# Run frontend development server
npm run dev
```
- **Frontend will run on**: `http://localhost:3000`
- **Hot reload enabled**

---

### **Terminal 2: Backend Server**
```bash
# Navigate to backend directory
cd D:\RAKAN\newagenticnavaia\Agentic-Navaia\backend

# Activate virtual environment (if using one)
# Windows:
.\venv\Scripts\Activate.ps1
# Or if you created it with different name:
# .\Scripts\activate

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

---

### **Terminal 3: Ngrok (Optional - for external access)**
```bash
# Only if you need external access to your local server
# Make sure backend is running on port 8000 first

# Run ngrok to expose backend externally
ngrok http 8000
```
- **Ngrok will provide external URL** for your backend
- **Example**: `https://suzi-superprepared-marlin.ngrok-free.dev` → connects to `http://localhost:8000`

---

## 📁 Directory Structure Reference

```
D:\RAKAN\newagenticnavaia\Agentic-Navaia\
├── src\              # Frontend source code
├── backend\          # Backend source code  
├── package.json      # Frontend dependencies
├── backend\requirements.txt  # Backend dependencies
├── backend\alembic\  # Database migrations
└── backend\app\      # Backend application
```

## 🔄 Order Is Critical

1. **First**: Start frontend server (Terminal 1)
2. **Second**: Start backend server (Terminal 2) 
3. **Third**: Start ngrok (Terminal 3) - if needed

## 🔧 Environment Setup

### **Frontend Environment (.env.local)**
```bash
# In D:\RAKAN\newagenticnavaia\Agentic-Navaia\.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

### **Backend Environment (.env)**
```bash
# In D:\RAKAN\newagenticnavaia\Agentic-Navaia\backend\.env
DB_URL=sqlite:///./dev.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🚨 Troubleshooting

### **If Backend Database Error:**
```bash
cd D:\RAKAN\newagenticnavaia\Agentic-Navaia\backend
alembic upgrade head
```

### **If Frontend Can't Connect to Backend:**
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local` 
- Ensure backend is running on port 8000
- Check backend CORS settings in `backend/app/main.py`

### **If Ngrok Issues:**
- Install ngrok: `npm install -g ngrok` or download from ngrok.com
- Make sure no other service is using port 8000

## 📝 Default Credentials
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Admin Panel**: `/admin` (if exists)
- **API Documentation**: `http://localhost:8000/docs`

## 🎯 Verification

✅ **Frontend**: Navigate to `http://localhost:3000` - should load UI  
✅ **Backend**: Navigate to `http://localhost:8000/docs` - should show API docs  
✅ **Database**: Tables created in `backend/dev.db`  
✅ **Integration**: API calls between frontend and backend working  

## 🚀 Production Notes

- For production: use `npm run build && npm start` for frontend
- For production backend: remove `--reload` flag
- Use proper reverse proxy (nginx) instead of ngrok for production
- Set up proper SSL certificates for HTTPS

**Your application is now fully configured and ready to run!** 🎉




for migrations
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
