"""Remove pending_approval status from tickets

Revision ID: 0e1f2e45b7c8
Revises: 57501f6758c5
Create Date: 2025-12-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.engine import Connection


# revision identifiers
revision = '0e1f2e45b7c8'
down_revision = '57501f6758c5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First, update any existing 'pending_approval' tickets to 'in_progress' or 'resolved'
    # depending on business logic - in this case we'll move them to 'in_progress'
    conn: Connection = op.get_bind()
    
    # Update existing tickets with pending_approval status
    conn.execute(text("UPDATE tickets SET status = 'in_progress' WHERE status = 'pending_approval'"))
    
    # Recreate the enum type without 'pending_approval'
    # Step 1: Create new enum type
    op.execute("CREATE TYPE ticketstatusenum_new AS ENUM('open', 'in_progress', 'resolved')")
    
    # Step 2: Update column to use new enum type
    op.execute("ALTER TABLE tickets ALTER COLUMN status TYPE ticketstatusenum_new USING status::text::ticketstatusenum_new")
    
    # Step 3: Drop old enum type
    op.execute("DROP TYPE ticketstatusenum")
    
    # Step 4: Rename new enum type to original name
    op.execute("ALTER TYPE ticketstatusenum_new RENAME TO ticketstatusenum")


def downgrade() -> None:
    # Recreate the enum type with 'pending_approval'
    # Step 1: Create new enum type with pending_approval
    op.execute("CREATE TYPE ticketstatusenum_new AS ENUM('open', 'in_progress', 'pending_approval', 'resolved')")
    
    # Step 2: Update column to use new enum type
    op.execute("ALTER TABLE tickets ALTER COLUMN status TYPE ticketstatusenum_new USING status::text::ticketstatusenum_new")
    
    # Step 3: Drop old enum type
    op.execute("DROP TYPE ticketstatusenum")
    
    # Step 4: Rename new enum type to original name
    op.execute("ALTER TYPE ticketstatusenum_new RENAME TO ticketstatusenum")