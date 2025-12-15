# File: backend/Dockerfile

# 1. Base Image
FROM python:3.11-slim

# 2. System Dependencies
# libpq-dev is required for psycopg2 (Postgres driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# 3. Environment Config
# Prevents Python from writing pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout/stderr (Instant logs)
ENV PYTHONUNBUFFERED=1
# Add app to path to avoid import errors
ENV PYTHONPATH=/app

WORKDIR /app

# 4. Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy Application Code
# Copy alembic config and migrations
COPY alembic.ini .
COPY alembic ./alembic
# Copy scripts directory
COPY scripts ./scripts
# Copy the app source code
COPY app ./app

# 6. Runtime
# Expose the port uvicorn runs on
EXPOSE 8000

# Start command
# We use --host 0.0.0.0 so Docker can map the port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]