"""Merge all migration branches into single linear chain

This migration consolidates all branched migrations into a single linear path.
It merges two development branches that were created independently:
- Branch A: Remove pending_approval status (0e1f2e45)
- Branch B: Tenant isolation + call fixes (fix_call_created_at)

After this merge, all future migrations will follow a single linear path.

Revision ID: 20260310_merge
Revises: 0e1f2e45b7c8, fix_call_created_at
Create Date: 2026-03-10 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260310_merge'
down_revision: Union[str, None] = ('0e1f2e45b7c8', 'fix_call_created_at')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration - no schema changes needed
    # All changes were applied in the branch migrations being merged
    pass


def downgrade() -> None:
    # To rollback, we would need to downgrade each branch separately
    # This is handled by alembic's merge mechanism
    pass
