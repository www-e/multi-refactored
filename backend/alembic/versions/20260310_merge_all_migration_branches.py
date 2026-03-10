"""Merge all migration branches

This migration consolidates the branched migration chains into a single linear path.
Branches being merged:
- Branch A: 0e1f2e45b7c8 (remove_pending_approval_status)
- Branch B: 8a1b3c5d7e9a (add_tenant_isolation_to_all_tables) which includes:
  - 7a1b3c5d7e9f (add_tenant_id_to_calls_table)
  - cee4b064007c (make_voice_session_customer_id_nullable)
  - fix_call_created_at (fix call created at)

This resolves the multiple heads issue that was causing deployment failures.

Revision ID: 20260310_merge
Revises: 0e1f2e45b7c8, 8a1b3c5d7e9a
Create Date: 2026-03-10 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260310_merge'
down_revision: Union[str, None] = ('0e1f2e45b7c8', '8a1b3c5d7e9a')
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
