"""
Quick Fix Script for Invalid Customer Emails

This script fixes invalid email addresses in the customers table that were
generated from Arabic names (e.g., '.@yahoo.com', '.ibrahim@navaia.com')

Usage:
    python -m scripts.fix_invalid_emails

For production server:
    ssh into server, then run this script inside the backend container
"""
import os
import sys

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import SessionLocal
from sqlalchemy import text


def fix_email(email: str) -> str | None:
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


def main():
    print("=" * 60)
    print("FIXING INVALID CUSTOMER EMAILS")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Get all customers
        result = db.execute(text("SELECT id, name, email FROM customers"))
        customers = result.fetchall()

        print(f"\nFound {len(customers)} customers total")

        # Count and fix invalid emails
        invalid_count = 0
        fixed_count = 0
        nulled_count = 0

        for customer_id, name, email in customers:
            fixed_email = fix_email(email)

            if fixed_email != email:
                invalid_count += 1
                print(f"\n[INVALID] {name}: {email}")

                if fixed_email:
                    db.execute(
                        text("UPDATE customers SET email = :email WHERE id = :id"),
                        {"email": fixed_email, "id": customer_id}
                    )
                    print(f"  -> FIXED: {fixed_email}")
                    fixed_count += 1
                else:
                    db.execute(
                        text("UPDATE customers SET email = NULL WHERE id = :id"),
                        {"id": customer_id}
                    )
                    print(f"  -> SET TO NULL")
                    nulled_count += 1

        if invalid_count > 0:
            db.commit()
            print("\n" + "=" * 60)
            print("SUMMARY")
            print("=" * 60)
            print(f"Total customers scanned: {len(customers)}")
            print(f"Invalid emails found: {invalid_count}")
            print(f"Fixed to valid emails: {fixed_count}")
            print(f"Set to NULL: {nulled_count}")
            print("\n[X] Invalid emails have been fixed!")
        else:
            print("\n[X] No invalid emails found - all emails are valid!")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
