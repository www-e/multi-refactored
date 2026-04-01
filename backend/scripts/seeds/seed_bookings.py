"""
Booking Seeder
Creates booking records for property viewings and rentals
"""
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.models import Booking, BookingStatusEnum, ChannelEnum, AIOrHumanEnum
from .base_seeder import BaseSeeder, PROJECT_NAMES, NEIGHBORHOODS


class BookingSeeder(BaseSeeder):
    """Seeder for bookings"""
    
    def seed_booking(
        self,
        customer_id: str,
        session_id: Optional[str] = None,
        property_code: str = None,
        project: str = None,
        start_date: datetime = None,
        preferred_datetime: datetime = None,
        status: BookingStatusEnum = None,
        price_sar: float = None,
        created_by: AIOrHumanEnum = AIOrHumanEnum.AI,
        customer_name: str = None,
        phone: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single booking"""
        booking_id = self.generate_id("bk")
        
        # Default values
        property_code = property_code or f"PROP-{random.randint(1000, 9999)}"
        project = project or random.choice(PROJECT_NAMES)
        
        created_at = created_at or datetime.utcnow()
        start_date = start_date or (created_at + timedelta(days=random.randint(1, 30)))
        preferred_datetime = preferred_datetime or (start_date + timedelta(hours=random.randint(9, 17)))
        
        # Status distribution
        if not status:
            status = random.choices(
                [BookingStatusEnum.pending, BookingStatusEnum.confirmed, BookingStatusEnum.completed, BookingStatusEnum.canceled],
                weights=[30, 30, 30, 10]
            )[0]
        
        # Price based on property type (SAR)
        if price_sar is None:
            price_sar = random.choice([
                5000, 7500, 10000,  # Monthly rent
                60000, 75000, 90000,  # Yearly rent
                150000, 200000, 250000  # Purchase
            ])
        
        booking = Booking(
            id=booking_id,
            tenant_id=self.tenant_id,
            customer_id=customer_id,
            session_id=session_id,
            property_code=property_code,
            project=project,
            start_date=start_date,
            preferred_datetime=preferred_datetime,
            status=status,
            price_sar=price_sar,
            source=ChannelEnum.voice,
            created_by=created_by,
            customer_name=customer_name,
            phone=phone,
            created_at=created_at
        )
        
        self.db.add(booking)
        self.db.commit()
        
        self.log(f"✅ Created Booking: {booking_id} ({project}, {status.value}) - {price_sar} SAR")
        return booking_id
    
    def seed_bulk(self, count: int = 20, customer_ids: List[str] = None, session_ids: List[str] = None) -> List[str]:
        """Seed multiple bookings"""
        booking_ids = []
        
        statuses = [
            BookingStatusEnum.pending, BookingStatusEnum.confirmed,
            BookingStatusEnum.confirmed, BookingStatusEnum.completed
        ]
        
        creators = [
            AIOrHumanEnum.AI, AIOrHumanEnum.AI, AIOrHumanEnum.AI, AIOrHumanEnum.Human
        ]  # 75% AI-created
        
        for i in range(count):
            customer_id = customer_ids[i] if customer_ids and i < len(customer_ids) else None
            
            if not customer_id:
                self.log(f"⚠️  Skipping booking {i+1}: No customer ID", "WARN")
                continue
            
            session_id = session_ids[i] if session_ids and i < len(session_ids) else None
            status = random.choice(statuses)
            created_by = random.choice(creators)
            
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 60),
                hours=random.randint(0, 23)
            )
            
            project = random.choice(PROJECT_NAMES)
            neighborhood = random.choice(NEIGHBORHOODS)
            
            booking_id = self.seed_booking(
                customer_id=customer_id,
                session_id=session_id,
                project=f"{project} - {neighborhood}",
                status=status,
                created_by=created_by,
                created_at=created_at
            )
            booking_ids.append(booking_id)
        
        self.log(f"✅ Created {count} bookings")
        return booking_ids


def run_booking_seeder(db, tenant_id: str = "demo-tenant", count: int = 20, customer_ids: List[str] = None, session_ids: List[str] = None):
    """Run booking seeder"""
    seeder = BookingSeeder(db, tenant_id)
    return seeder.seed_bulk(count, customer_ids, session_ids)
