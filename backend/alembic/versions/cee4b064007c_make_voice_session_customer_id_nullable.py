"""make_voice_session_customer_id_nullable

Revision ID: cee4b064007c
Revises: 8a1b3c5d7e9a
Create Date: 2025-12-09 18:54:25.146887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cee4b064007c'
down_revision: Union[str, None] = '8a1b3c5d7e9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make customer_id nullable in voice_sessions table
    op.alter_column('voice_sessions', 'customer_id',
                    existing_type=sa.String(),
                    nullable=True)


def downgrade() -> None:
    # Revert: make customer_id NOT nullable
    op.alter_column('voice_sessions', 'customer_id',
                    existing_type=sa.String(),
                    nullable=False)
