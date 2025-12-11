"""Merge migration branches to resolve multiple heads issue

Revision ID: 0caf10b8fb29
Revises: 0e1f2e45b7c8, fix_call_created_at
Create Date: 2025-12-11 20:13:47.232106

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0caf10b8fb29'
down_revision: Union[str, None] = ('0e1f2e45b7c8', 'fix_call_created_at')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
