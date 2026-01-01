"""
Admin user seeding script
This script creates an initial admin user if no admin users exist in the database
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, UserRoleEnum
from app.password_utils import hash_password

# Add the backend directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__)))

def seed_admin_user():
    # Get database URL - use the same logic as in db.py
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    sqlite_path = os.path.join(base_dir, 'dev.db')
    db_url = os.getenv("DB_URL", f"sqlite:///{sqlite_path}")
    
    # Create database engine and session
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if any admin user already exists
        existing_admin = db.query(User).filter(User.role == UserRoleEnum.admin).first()
        
        if existing_admin:
            print("Admin user already exists. Skipping seeding.")
            return
        
        # Get admin credentials from environment variables or use defaults
        admin_email = os.getenv("ADMIN_EMAIL", "admin@navaia.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!Admin123!")
        admin_name = os.getenv("ADMIN_NAME", "Administrator")
        
        # Check if a user with this email already exists
        existing_user = db.query(User).filter(User.email == admin_email).first()
        if existing_user:
            print(f"User with email {admin_email} already exists. Skipping seeding.")
            return
        
        # Create the admin user
        import secrets
        
        user_id = f"usr_{secrets.token_hex(8)}"
        hashed_password = hash_password(admin_password)
        
        # Use env variable first, fallback to unique ID only if env is missing
        tenant_id = os.getenv("TENANT_ID", f"tenant-{user_id}")
        
        admin_user = User(
            id=user_id,
            email=admin_email,
            password_hash=hashed_password,
            name=admin_name,
            role=UserRoleEnum.admin,
            tenant_id=tenant_id
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print(f"Name: {admin_name}")
        print(f"Role: {admin_user.role.value}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin_user()