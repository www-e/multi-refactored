#!/bin/bash

# Development startup script for Voice Agent Portal
# Runs both backend (FastAPI) and frontend (Next.js) in parallel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE} Starting Voice Agent Portal Development Servers${NC}"

# Kill any existing processes on ports 3000 and 8000
echo -e "${YELLOW} Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Get the project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

echo -e "${GREEN}📁 Project directory: $PROJECT_DIR${NC}"

# Function to start backend
start_backend() {
    echo -e "${BLUE} Starting Backend (FastAPI) on port 8000...${NC}"
    cd "$BACKEND_DIR"
    
    # Check if virtual environment exists
    if [ ! -d ".venv312" ]; then
        echo -e "${RED} Virtual environment not found at $BACKEND_DIR/.venv312${NC}"
        exit 1
    fi
    
    # Start backend server
    .venv312/bin/python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 2>&1 | sed 's/^/[BACKEND] /' &
    BACKEND_PID=$!
    echo -e "${GREEN} Backend started with PID: $BACKEND_PID${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE} Starting Frontend (Next.js) on port 3000...${NC}"
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend server
    npm run dev 2>&1 | sed 's/^/[FRONTEND] /' &
    FRONTEND_PID=$!
    echo -e "${GREEN} Frontend started with PID: $FRONTEND_PID${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW} Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    # Kill any remaining processes on the ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN} Cleanup complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
sleep 2  # Give backend time to start
start_frontend

echo -e "${GREEN} Development servers are starting up!${NC}"
echo -e "${BLUE} Backend:  http://127.0.0.1:8000${NC}"
echo -e "${BLUE} Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}⚡ Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
