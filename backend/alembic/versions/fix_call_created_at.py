"""fix call created at

Revision ID: fix_call_created_at
Revises: cee4b064007c
Create Date: 2025-12-10 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = 'fix_call_created_at'
down_revision: Union[str, None] = 'cee4b064007c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Add column as nullable first (SQLite supports ADD COLUMN)
    op.add_column('calls', sa.Column('created_at', sa.DateTime(), nullable=True))
    
    # 2. Populate existing rows 
    # 'CURRENT_TIMESTAMP' is valid in both SQLite and PostgreSQL
    op.execute("UPDATE calls SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
    
    # 3. Make it non-nullable using batch mode (Critical for SQLite)
    with op.batch_alter_table('calls', schema=None) as batch_op:
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(),
                              nullable=False)

def downgrade() -> None:
    # Drop column using batch mode (Critical for SQLite)
    with op.batch_alter_table('calls', schema=None) as batch_op:
        batch_op.drop_column('created_at')