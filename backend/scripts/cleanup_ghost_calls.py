"""
Script to clean up ghost calls - ACTIVE voice sessions that should be COMPLETED
This fixes the issue where calls remain in "المكالمات الحالية" forever
"""
import sys
import os
from datetime import datetime, timezone, timedelta

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.db import SessionLocal
from app import models

def cleanup_ghost_calls():
    """
    Find and mark as COMPLETED any ACTIVE voice sessions that are older than 10 minutes
    """
    db = SessionLocal()
    try:
        # Find all ACTIVE sessions older than 10 minutes
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=10)
        
        ghost_calls = db.query(models.VoiceSession).filter(
            models.VoiceSession.status == models.VoiceSessionStatus.ACTIVE,
            models.VoiceSession.created_at < cutoff_time
        ).all()
        
        print(f"Found {len(ghost_calls)} ghost calls to clean up")
        
        for call in ghost_calls:
            print(f"Cleaning up call {call.id} - Created: {call.created_at}")
            call.status = models.VoiceSessionStatus.COMPLETED
            if not call.ended_at:
                # Set ended_at to 5 minutes after creation as a reasonable estimate
                call.ended_at = call.created_at + timedelta(minutes=5)
        
        db.commit()
        print(f"Successfully cleaned up {len(ghost_calls)} ghost calls")
        
    except Exception as e:
        print(f"Error cleaning up ghost calls: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_ghost_calls()
