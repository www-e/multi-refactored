"""
Customer Seeder
Creates realistic customer data with Arabic names and Saudi phone numbers
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
from app.models import Customer
from .base_seeder import BaseSeeder, ARABIC_NAMES, NEIGHBORHOODS, ARABIC_FIRST_NAMES, ARABIC_LAST_NAMES


class CustomerSeeder(BaseSeeder):
    """Seeder for customers"""

    def seed_customer(
        self,
        name: str = None,
        phone: str = None,
        email: str = None,
        neighborhoods: List[str] = None,
        consent: bool = True
    ) -> str:
        """Seed a single customer"""
        customer_id = self.generate_id("cust")

        name = name or random.choice(ARABIC_NAMES)
        phone = phone or self.generate_phone()
        email = email or self.generate_email(name)
        neighborhoods = neighborhoods or [random.choice(NEIGHBORHOODS)]

        customer = Customer(
            id=customer_id,
            tenant_id=self.tenant_id,
            name=name,
            phone=phone,
            email=email,
            neighborhoods=neighborhoods,
            consent=consent,
            created_at=datetime.utcnow()
        )

        self.db.add(customer)
        self.db.commit()

        self.log(f"✅ Created Customer: {name} ({phone})")
        return customer_id

    def seed_bulk(self, count: int = 50) -> List[str]:
        """Seed multiple customers with realistic data"""
        customer_ids = []

        # Pre-generate data for variety
        names = self._generate_names(count)

        for i in range(count):
            name = names[i]
            phone = self.generate_phone()
            email = self.generate_email(name)
            num_neighborhoods = random.randint(1, 3)
            neighborhoods = random.sample(NEIGHBORHOODS, num_neighborhoods)
            consent = random.choice([True, True, True, False])  # 75% consent

            customer_id = self.generate_id("cust")

            customer = Customer(
                id=customer_id,
                tenant_id=self.tenant_id,
                name=name,
                phone=phone,
                email=email,
                neighborhoods=neighborhoods,
                consent=consent,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 180))
            )

            self.db.add(customer)
            customer_ids.append(customer_id)

            # Commit every 10 customers for performance
            if (i + 1) % 10 == 0:
                self.db.commit()
                self.log(f"📊 Committed {i + 1}/{count} customers...")

        self.db.commit()
        self.log(f"✅ Created {count} customers")
        return customer_ids

    def _generate_names(self, count: int) -> List[str]:
        """Generate a list of names with variety"""
        names = []
        for i in range(count):
            if i < len(ARABIC_NAMES):
                names.append(ARABIC_NAMES[i])
            else:
                # Generate composite names
                first = random.choice(ARABIC_FIRST_NAMES)
                last = random.choice(ARABIC_LAST_NAMES)
                names.append(f"{first} {last}")
        return names

    def get_customer_by_phone(self, phone: str):
        """Get customer by phone number"""
        return self.db.query(Customer).filter(Customer.phone == phone).first()


def run_customer_seeder(db, tenant_id: str = "demo-tenant", count: int = 50):
    """Run customer seeder"""
    seeder = CustomerSeeder(db, tenant_id)
    return seeder.seed_bulk(count)
