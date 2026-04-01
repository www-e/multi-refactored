"""fix invalid customer emails

Revision ID: 8c2b248ea010
Revises: d5949b6ea945
Create Date: 2026-04-01 20:07:40.732719

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session


# revision identifiers, used by Alembic.
revision: str = '8c2b248ea010'
down_revision: Union[str, None] = 'd5949b6ea945'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _fix_email(email: str) -> str | None:
    """Fix invalid email patterns, return None if cannot be fixed."""
    if not email:
        return None

    # Remove leading periods
    email = email.lstrip('.')

    # Must have @ and content before and after it
    if '@' not in email:
        return None

    local, domain = email.split('@', 1)
    local = local.strip('.')

    if not local or not domain:
        return None

    return f"{local}@{domain}"


def upgrade() -> None:
    """
    Fix invalid customer emails that were generated from Arabic names.
    Invalid patterns:
    - '.@domain.com' (empty local part) - set to NULL
    - '.ibrahim@domain.com' (starts with period) - remove leading period
    """
    bind = op.get_bind()
    session = Session(bind=bind)

    try:
        # Get all customers with invalid emails
        from sqlalchemy import text
        result = session.execute(text("SELECT id, email FROM customers"))

        updates = []
        for row in result:
            customer_id, email = row
            fixed_email = _fix_email(email)

            if fixed_email != email:
                updates.append({"id": customer_id, "email": fixed_email})

        # Apply updates in batch
        if updates:
            for update in updates:
                if update["email"]:
                    session.execute(
                        text("UPDATE customers SET email = :email WHERE id = :id"),
                        {"email": update["email"], "id": update["id"]}
                    )
                else:
                    session.execute(
                        text("UPDATE customers SET email = NULL WHERE id = :id"),
                        {"id": update["id"]}
                    )
            session.commit()

    finally:
        session.close()


def downgrade() -> None:
    """
    No downgrade possible - we can't restore the original invalid emails.
    This migration only fixes data quality issues.
    """
    pass
