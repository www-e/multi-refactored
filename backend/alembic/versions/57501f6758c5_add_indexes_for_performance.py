"""add_indexes_for_performance

Revision ID: 57501f6758c5
Revises: c1c3c5a1c065
Create Date: 2025-11-30 16:05:04.963655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57501f6758c5'
down_revision: Union[str, None] = 'c1c3c5a1c065'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes for Customer table
    op.create_index(op.f('ix_customers_name'), 'customers', ['name'], unique=False)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=False)
    op.create_index(op.f('ix_customers_created_at'), 'customers', ['created_at'], unique=False)

    # Add indexes for Conversation table
    op.create_index(op.f('ix_conversations_channel'), 'conversations', ['channel'], unique=False)
    op.create_index(op.f('ix_conversations_customer_id'), 'conversations', ['customer_id'], unique=False)
    op.create_index(op.f('ix_conversations_ai_or_human'), 'conversations', ['ai_or_human'], unique=False)
    op.create_index(op.f('ix_conversations_created_at'), 'conversations', ['created_at'], unique=False)


    # Add indexes for Call table
    op.create_index(op.f('ix_calls_direction'), 'calls', ['direction'], unique=False)
    op.create_index(op.f('ix_calls_status'), 'calls', ['status'], unique=False)
    op.create_index(op.f('ix_calls_outcome'), 'calls', ['outcome'], unique=False)
    op.create_index(op.f('ix_calls_ai_or_human'), 'calls', ['ai_or_human'], unique=False)

    # Add indexes for Ticket table
    op.create_index(op.f('ix_tickets_customer_id'), 'tickets', ['customer_id'], unique=False)
    op.create_index(op.f('ix_tickets_priority'), 'tickets', ['priority'], unique=False)
    op.create_index(op.f('ix_tickets_category'), 'tickets', ['category'], unique=False)
    op.create_index(op.f('ix_tickets_status'), 'tickets', ['status'], unique=False)
    op.create_index(op.f('ix_tickets_assignee'), 'tickets', ['assignee'], unique=False)
    op.create_index(op.f('ix_tickets_created_at'), 'tickets', ['created_at'], unique=False)
    op.create_index(op.f('ix_tickets_session_id'), 'tickets', ['session_id'], unique=False)

    # Add indexes for Booking table
    op.create_index(op.f('ix_bookings_customer_id'), 'bookings', ['customer_id'], unique=False)
    op.create_index(op.f('ix_bookings_property_code'), 'bookings', ['property_code'], unique=False)
    op.create_index(op.f('ix_bookings_start_date'), 'bookings', ['start_date'], unique=False)
    op.create_index(op.f('ix_bookings_status'), 'bookings', ['status'], unique=False)
    op.create_index(op.f('ix_bookings_source'), 'bookings', ['source'], unique=False)
    op.create_index(op.f('ix_bookings_created_by'), 'bookings', ['created_by'], unique=False)
    op.create_index(op.f('ix_bookings_created_at'), 'bookings', ['created_at'], unique=False)
    op.create_index(op.f('ix_bookings_session_id'), 'bookings', ['session_id'], unique=False)

    # Add indexes for Campaign table
    op.create_index(op.f('ix_campaigns_name'), 'campaigns', ['name'], unique=False)
    op.create_index(op.f('ix_campaigns_type'), 'campaigns', ['type'], unique=False)
    op.create_index(op.f('ix_campaigns_objective'), 'campaigns', ['objective'], unique=False)
    op.create_index(op.f('ix_campaigns_status'), 'campaigns', ['status'], unique=False)
    op.create_index(op.f('ix_campaigns_created_at'), 'campaigns', ['created_at'], unique=False)

    # Add indexes for Event table
    op.create_index(op.f('ix_events_created_at'), 'events', ['created_at'], unique=False)

    # Add indexes for VoiceSession table
    op.create_index(op.f('ix_voice_sessions_customer_id'), 'voice_sessions', ['customer_id'], unique=False)
    op.create_index(op.f('ix_voice_sessions_direction'), 'voice_sessions', ['direction'], unique=False)
    op.create_index(op.f('ix_voice_sessions_status'), 'voice_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_voice_sessions_created_at'), 'voice_sessions', ['created_at'], unique=False)
    op.create_index(op.f('ix_voice_sessions_agent_id'), 'voice_sessions', ['agent_id'], unique=False)


def downgrade() -> None:
    # Drop indexes for VoiceSession table
    op.drop_index(op.f('ix_voice_sessions_agent_id'), table_name='voice_sessions')
    op.drop_index(op.f('ix_voice_sessions_created_at'), table_name='voice_sessions')
    op.drop_index(op.f('ix_voice_sessions_status'), table_name='voice_sessions')
    op.drop_index(op.f('ix_voice_sessions_direction'), table_name='voice_sessions')
    op.drop_index(op.f('ix_voice_sessions_customer_id'), table_name='voice_sessions')

    # Drop indexes for Event table
    op.drop_index(op.f('ix_events_created_at'), table_name='events')

    # Drop indexes for Campaign table
    op.drop_index(op.f('ix_campaigns_created_at'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_status'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_objective'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_type'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_name'), table_name='campaigns')

    # Drop indexes for Booking table
    op.drop_index(op.f('ix_bookings_session_id'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_created_at'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_created_by'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_source'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_status'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_start_date'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_property_code'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_customer_id'), table_name='bookings')

    # Drop indexes for Ticket table
    op.drop_index(op.f('ix_tickets_session_id'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_created_at'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_assignee'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_status'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_category'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_priority'), table_name='tickets')
    op.drop_index(op.f('ix_tickets_customer_id'), table_name='tickets')

    # Drop indexes for Call table
    op.drop_index(op.f('ix_calls_ai_or_human'), table_name='calls')
    op.drop_index(op.f('ix_calls_outcome'), table_name='calls')
    op.drop_index(op.f('ix_calls_status'), table_name='calls')
    op.drop_index(op.f('ix_calls_direction'), table_name='calls')


    # Drop indexes for Conversation table
    op.drop_index(op.f('ix_conversations_created_at'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_ai_or_human'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_customer_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_channel'), table_name='conversations')

    # Drop indexes for Customer table
    op.drop_index(op.f('ix_customers_created_at'), table_name='customers')
    op.drop_index(op.f('ix_customers_email'), table_name='customers')
    op.drop_index(op.f('ix_customers_name'), table_name='customers')
