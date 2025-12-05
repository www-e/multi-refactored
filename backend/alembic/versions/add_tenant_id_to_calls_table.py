"""Add tenant_id to calls table

Revision ID: 7a1b3c5d7e9f
Revises: 57501f6758c5
Create Date: 2025-12-05 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '7a1b3c5d7e9f'
down_revision: Union[str, None] = '57501f6758c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tenant_id column to calls table
    op.add_column('calls', sa.Column('tenant_id', sa.String(), nullable=True))

    # Create index for tenant_id for performance
    op.create_index(op.f('ix_calls_tenant_id'), 'calls', ['tenant_id'], unique=False)

    # For now, make tenant_id nullable to avoid issues with existing records during migration
    # Once the application is updated to always include tenant_id when creating calls,
    # we can enforce the non-null constraint in a future migration


def downgrade() -> None:
    # Remove tenant_id column from calls table
    op.drop_index(op.f('ix_calls_tenant_id'), table_name='calls')
    op.drop_column('calls', 'tenant_id')