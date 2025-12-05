"""Add tenant isolation to all tables that need it

Revision ID: 8a1b3c5d7e9a
Revises: 7a1b3c5d7e9f
Create Date: 2025-12-05 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '8a1b3c5d7e9a'
down_revision: Union[str, None] = '7a1b3c5d7e9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tenant_id column to users table
    op.add_column('users', sa.Column('tenant_id', sa.String(), nullable=True))

    # Create index for tenant_id for performance
    op.create_index(op.f('ix_users_tenant_id'), 'users', ['tenant_id'], unique=False)

    # Update existing users with a default tenant_id if they don't have one
    # For existing users, we'll assign them to a default tenant
    conn = op.get_bind()
    conn.execute(text("""
        UPDATE users
        SET tenant_id = 'default-tenant-' || id
        WHERE tenant_id IS NULL OR tenant_id = ''
    """))

    # Add tenant_id column to campaign_metrics table
    op.add_column('campaign_metrics', sa.Column('tenant_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_campaign_metrics_tenant_id'), 'campaign_metrics', ['tenant_id'], unique=False)

    # Populate tenant_id from associated campaigns for campaign_metrics
    conn.execute(text("""
        UPDATE campaign_metrics
        SET tenant_id = (
            SELECT campaigns.tenant_id
            FROM campaigns
            WHERE campaigns.id = campaign_metrics.campaign_id
        )
        WHERE campaign_metrics.campaign_id IS NOT NULL
    """))

    # Add tenant_id column to handoffs table
    op.add_column('handoffs', sa.Column('tenant_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_handoffs_tenant_id'), 'handoffs', ['tenant_id'], unique=False)

    # Populate tenant_id from associated conversations for handoffs
    conn.execute(text("""
        UPDATE handoffs
        SET tenant_id = (
            SELECT conversations.tenant_id
            FROM conversations
            WHERE conversations.id = handoffs.conversation_id
        )
        WHERE handoffs.conversation_id IS NOT NULL
    """))

    # Add tenant_id column to approvals table
    op.add_column('approvals', sa.Column('tenant_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_approvals_tenant_id'), 'approvals', ['tenant_id'], unique=False)

    # For approvals, we can't reliably determine tenant from entity_id without knowing entity_type
    # So we'll assign a default tenant for now, but in a real system you'd need better logic
    # For this migration, we'll just set it to a placeholder that should be updated separately
    conn.execute(text("""
        UPDATE approvals
        SET tenant_id = 'unassigned-tenant'
        WHERE tenant_id IS NULL OR tenant_id = ''
    """))

    # Create organizations table
    op.create_table('organizations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id')
    )
    op.create_index(op.f('ix_organizations_tenant_id'), 'organizations', ['tenant_id'], unique=True)


def downgrade() -> None:
    # Drop organizations table
    op.drop_table('organizations')
    
    # Remove tenant_id column from approvals table
    op.drop_index(op.f('ix_approvals_tenant_id'), table_name='approvals')
    op.drop_column('approvals', 'tenant_id')
    
    # Remove tenant_id column from handoffs table
    op.drop_index(op.f('ix_handoffs_tenant_id'), table_name='handoffs')
    op.drop_column('handoffs', 'tenant_id')
    
    # Remove tenant_id column from campaign_metrics table
    op.drop_index(op.f('ix_campaign_metrics_tenant_id'), table_name='campaign_metrics')
    op.drop_column('campaign_metrics', 'tenant_id')
    
    # Remove tenant_id column from users table
    op.drop_index(op.f('ix_users_tenant_id'), table_name='users')
    op.drop_column('users', 'tenant_id')