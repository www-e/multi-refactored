import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from dotenv import load_dotenv

from alembic import context

# --- Alembic Configuration ---

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# --- Path and Model Setup ---

# 1. Load the .env file from the parent 'backend' directory.
# This makes environment variables like DB_URL available to Alembic.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# 2. Add the 'backend' directory to Python's path.
# This is crucial so that Alembic can find your 'app' module.
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

# 3. Import your SQLAlchemy Base metadata.
# This object contains all the information about your tables and columns.
from app.db import Base
# This import ensures all your models are registered with the Base metadata.
from app.models import *

# 4. Set the target_metadata for Alembic's autogenerate support.
target_metadata = Base.metadata

# --- End of Custom Setup ---

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.
    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # This section is modified to pull the DB_URL from the environment
    # into the Alembic configuration object.
    configuration = config.get_section(config.config_ini_section, {})
    configuration['sqlalchemy.url'] = os.getenv('DB_URL')
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()