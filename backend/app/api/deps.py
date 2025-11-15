# backend/app/api/deps.py
from app.db import get_session
from app.auth_utils import get_current_user
from app.models import User