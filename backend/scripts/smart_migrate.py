#!/usr/bin/env python3
"""
Simplified Migration Script for Agentic Navaia.
Runs alembic migrations with proper error handling and logging.
"""

import os
import sys
import logging
import subprocess
from alembic.config import Config
from alembic import command
from alembic.util.exc import CommandError
from sqlalchemy import create_engine, text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_database_url():
    """Get database URL from environment or use default."""
    db_url = os.environ.get('DB_URL')
    if not db_url:
        # Default PostgreSQL URL for Docker container
        db_url = "postgresql://navaia:navaia@agentic_portal_db:5432/navaia"
    return db_url


def check_database_connection(db_url: str) -> bool:
    """Test database connection."""
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def check_current_version(db_url: str) -> str | None:
    """Check current alembic version in database."""
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1;")).fetchone()
            if result:
                logger.info(f"📌 Current alembic version: {result[0]}")
                return result[0]
        logger.info("📌 No alembic version found (fresh database)")
        return None
    except Exception as e:
        logger.info(f"📌 Alembic version table doesn't exist: {e}")
        return None


def run_migrations():
    """Run alembic migrations."""
    db_url = get_database_url()
    logger.info(f"🚀 Starting migration process")
    logger.info(f"📍 Database URL: {db_url}")

    # Check database connection
    if not check_database_connection(db_url):
        logger.error("❌ Cannot connect to database")
        sys.exit(1)

    # Check current version
    check_current_version(db_url)

    # Configure alembic
    alembic_cfg = Config("/app/alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)

    # Check current alembic heads
    logger.info("🔍 Checking migration status...")
    try:
        from alembic.script import ScriptDirectory
        script_dir = ScriptDirectory.from_config(alembic_cfg)

        # Get all heads
        heads = [rev.revision for rev in script_dir.get_revisions("head")]
        logger.info(f"📊 Migration heads: {heads}")

        # Check if there are multiple heads (branched migrations)
        if len(heads) > 1:
            logger.warning(f"⚠️  Multiple migration heads detected: {heads}")
            logger.warning("⚠️  This may indicate a migration branch that needs to be merged")

    except Exception as e:
        logger.warning(f"⚠️  Could not check migration heads: {e}")

    # Run the migration
    try:
        logger.info("⏳ Running alembic upgrade to head...")
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Migration completed successfully!")

        # Show final version
        final_version = check_current_version(db_url)
        if final_version:
            logger.info(f"✅ Final migration version: {final_version}")

        return True

    except CommandError as e:
        error_msg = str(e)
        logger.error(f"❌ Migration failed: {error_msg}")

        # Provide helpful error messages
        if "multiple heads" in error_msg.lower():
            logger.error("🔧 Fix: Run 'alembic merge' to consolidate migration branches")
        elif "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
            logger.error("🔧 Fix: Database schema may already exist. Try stamping with current version.")
        elif "foreign key" in error_msg.lower():
            logger.error("🔧 Fix: Foreign key constraint violation - check data integrity")

        return False

    except Exception as e:
        logger.error(f"❌ Unexpected error during migration: {e}")
        return False


def main():
    """Main entry point."""
    success = run_migrations()

    if success:
        logger.info("🎉 All migrations completed successfully!")
        sys.exit(0)
    else:
        logger.error("💥 Migration process failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
