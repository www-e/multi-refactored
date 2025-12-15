#!/usr/bin/env python3
"""
Smart Migration Script for handling alembic migrations with existing database schemas.
This script detects if tables already exist but aren't tracked by alembic, and handles
the migration appropriately.
"""

import os
import sys
import subprocess
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from alembic.config import Config
from alembic import command
from alembic.util.exc import CommandError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_connection(db_url: str):
    """Test if we can connect to the database."""
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def check_table_exists(engine, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        result = engine.execute(text(f"SELECT to_regclass('{table_name}');")).fetchone()
        return result and result[0] is not None
    except Exception:
        # For SQLite compatibility or other databases
        try:
            result = engine.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")).fetchone()
            return bool(result)
        except Exception:
            # Last resort: assume it exists if we can't check
            return False

def check_alembic_current_version(engine):
    """Check the current alembic version in the database."""
    try:
        result = engine.execute(text("SELECT version_num FROM alembic_version LIMIT 1;")).fetchone()
        if result:
            return result[0]
        return None
    except Exception as e:
        logger.info(f"Alembic version table doesn't exist or error occurred: {e}")
        return None

def ensure_alembic_version_table(engine):
    """Ensure the alembic_version table exists."""
    try:
        engine.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL, 
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            );
        """))
        logger.info("Alembic version table ensured")
    except Exception as e:
        logger.error(f"Could not create alembic_version table: {e}")

def smart_migrate(db_url: str):
    """Perform smart migration handling existing schemas."""
    logger.info("Starting smart migration process...")
    
    # Connect to database
    engine = create_engine(db_url)
    
    # Check if key tables exist (approvals as our indicator)
    approvals_exist = check_table_exists(engine, 'approvals')
    logger.info(f"Approvals table exists: {approvals_exist}")
    
    # Check current alembic version
    current_version = check_alembic_current_version(engine)
    logger.info(f"Current alembic version: {current_version}")
    
    alembic_cfg = Config("/app/alembic.ini")
    
    if approvals_exist and not current_version:
        logger.info("Schema exists but no alembic tracking - setting up alembic...")
        
        # Ensure alembic_version table exists
        ensure_alembic_version_table(engine)
        
        # Stamp with the initial migration (assuming c1c3c5a1c065 is the first)
        try:
            # Get the actual first migration revision
            from alembic.script import ScriptDirectory
            script_dir = ScriptDirectory.from_config(alembic_cfg)
            first_revision = None
            
            # Find the root migration (the one with no down_revision)
            for revision in script_dir.walk_revisions():
                if revision.down_revision is None and revision.revision is not None:
                    first_revision = revision.revision
                    break
            
            if first_revision:
                logger.info(f"Stamping database with initial migration: {first_revision}")
                command.stamp(alembic_cfg, first_revision)
                logger.info("Successfully stamped database")
            else:
                logger.error("Could not find initial migration revision")
                return False
                
        except Exception as e:
            logger.error(f"Failed to stamp database: {e}")
            return False
    
    # Now run the upgrade to head
    try:
        logger.info("Running alembic upgrade to head...")
        command.upgrade(alembic_cfg, "head")
        logger.info("Migration completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Migration upgrade failed: {e}")
        return False

def main():
    db_url = os.environ.get('DB_URL')
    if not db_url:
        # Fallback to default PostgreSQL URL for the container
        db_url = "postgresql://navaia:navaia@agentic_portal_db:5432/navaia"
    
    logger.info(f"Using database URL: {db_url}")
    
    # Check database connection
    if not check_database_connection(db_url):
        logger.error("Cannot connect to database")
        sys.exit(1)
    
    # Perform smart migration
    success = smart_migrate(db_url)
    
    if not success:
        logger.error("Smart migration failed")
        sys.exit(1)
    
    logger.info("Smart migration completed successfully!")
    sys.exit(0)

if __name__ == "__main__":
    main()