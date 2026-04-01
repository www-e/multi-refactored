"""
User Seeder
Creates admin and regular users for authentication
"""
from datetime import datetime
import random
from app.models import User, UserRoleEnum
from app.password_utils import hash_password
from .base_seeder import BaseSeeder


class UserSeeder(BaseSeeder):
    """Seeder for users"""
    
    def seed_admin(self, email: str = None, password: str = None, name: str = None) -> str:
        """Seed an admin user"""
        user_id = self.generate_id("usr")
        
        email = email or "admin@navaia.com"
        password = password or "Admin123!Admin123!"
        name = name or "Administrator"
        
        # Check if user exists
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            self.log(f"⚠️  User {email} already exists", "WARN")
            return existing.id
        
        hashed_password = hash_password(password)
        
        user = User(
            id=user_id,
            email=email,
            password_hash=hashed_password,
            name=name,
            role=UserRoleEnum.admin,
            is_active=True,
            tenant_id=self.tenant_id,
            created_at=datetime.utcnow(),
            last_login_at=None
        )
        
        self.db.add(user)
        self.db.commit()
        
        self.log(f"✅ Created Admin User: {name} ({email})")
        return user_id
    
    def seed_user(self, email: str, password: str, name: str, role: UserRoleEnum = UserRoleEnum.user) -> str:
        """Seed a regular user"""
        user_id = self.generate_id("usr")
        
        # Check if user exists
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            self.log(f"⚠️  User {email} already exists", "WARN")
            return existing.id
        
        hashed_password = hash_password(password)
        
        user = User(
            id=user_id,
            email=email,
            password_hash=hashed_password,
            name=name,
            role=role,
            is_active=True,
            tenant_id=self.tenant_id,
            created_at=datetime.utcnow(),
            last_login_at=None
        )
        
        self.db.add(user)
        self.db.commit()
        
        self.log(f"✅ Created User: {name} ({email}) - Role: {role.value}")
        return user_id
    
    def seed_multiple(self, count: int = 5, admin_count: int = 1) -> list:
        """Seed multiple users with mixed roles"""
        user_ids = []
        
        # Seed admins first
        for i in range(admin_count):
            user_id = self.seed_admin(
                email=f"admin{i+1}@navaia.com" if i > 0 else "admin@navaia.com",
                name=f"Administrator {i+1}" if i > 0 else "Administrator"
            )
            user_ids.append(user_id)
        
        # Seed regular users
        from .base_seeder import ARABIC_NAMES
        
        for i in range(count):
            name = ARABIC_NAMES[i % len(ARABIC_NAMES)]
            email = self.generate_email(name)
            # Add employee number to email to avoid duplicates
            email = f"employee{i+1}@navaia.com"
            
            user_id = self.seed_user(
                email=email,
                password="User123!",
                name=name,
                role=UserRoleEnum.user
            )
            user_ids.append(user_id)
        
        self.log(f"✅ Created {len(user_ids)} users total")
        return user_ids


def run_user_seeder(db, tenant_id: str = "demo-tenant", user_count: int = 5, admin_count: int = 1):
    """Run user seeder"""
    seeder = UserSeeder(db, tenant_id)
    return seeder.seed_multiple(count=user_count, admin_count=admin_count)
