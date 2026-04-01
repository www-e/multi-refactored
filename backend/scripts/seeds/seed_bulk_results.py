"""
Bulk Call Result Seeder
Creates individual call results for bulk campaigns
"""
from datetime import datetime, timedelta
from typing import List
import random
from app.models import BulkCallResult, BulkCallResultStatusEnum, BulkCallOutcomeEnum
from .base_seeder import BaseSeeder


class BulkCallResultSeeder(BaseSeeder):
    """Seeder for bulk call results"""
    
    def seed_result(
        self,
        campaign_id: str,
        customer_id: str,
        customer_name: str,
        customer_phone: str,
        status: BulkCallResultStatusEnum = None,
        outcome: BulkCallOutcomeEnum = None,
        duration_seconds: int = None,
        error_message: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single bulk call result"""
        result_id = self.generate_id("result")
        
        created_at = created_at or datetime.utcnow()
        
        # Status distribution
        if not status:
            status = random.choices(
                [
                    BulkCallResultStatusEnum.success,
                    BulkCallResultStatusEnum.failed,
                    BulkCallResultStatusEnum.no_answer,
                    BulkCallResultStatusEnum.voicemail,
                    BulkCallResultStatusEnum.busy
                ],
                weights=[50, 15, 20, 10, 5]
            )[0]
        
        # Outcome only for successful calls
        if status == BulkCallResultStatusEnum.success and not outcome:
            outcome = random.choices(
                [
                    BulkCallOutcomeEnum.interested,
                    BulkCallOutcomeEnum.appointment_booked,
                    BulkCallOutcomeEnum.follow_up_requested,
                    BulkCallOutcomeEnum.information_only,
                    BulkCallOutcomeEnum.not_interested
                ],
                weights=[30, 20, 20, 20, 10]
            )[0]
        
        # Duration for completed calls
        if status == BulkCallResultStatusEnum.success and duration_seconds is None:
            duration_seconds = random.randint(60, 600)  # 1-10 minutes
        
        # Error message for failed calls
        if status in [BulkCallResultStatusEnum.failed, BulkCallResultStatusEnum.busy] and not error_message:
            error_message = random.choice([
                "رقم غير صحيح",
                "الخط مشغول",
                "فشل الاتصال",
                "انتهت المهلة"
            ])
        
        result = BulkCallResult(
            id=result_id,
            campaign_id=campaign_id,
            tenant_id=self.tenant_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            status=status,
            outcome=outcome,
            duration_seconds=duration_seconds,
            error_message=error_message,
            created_at=created_at,
            updated_at=created_at
        )
        
        self.db.add(result)
        self.db.commit()
        
        self.log(f"✅ Created Result: {result_id} ({customer_name}) - {status.value}")
        return result_id
    
    def seed_for_campaign(self, campaign_id: str, customer_ids: List[str], customer_data: dict = None) -> List[str]:
        """Seed results for a campaign"""
        result_ids = []
        
        if not customer_data:
            customer_data = {}
        
        for i, customer_id in enumerate(customer_ids):
            name = customer_data.get(customer_id, {}).get('name', f'عميل {i+1}')
            phone = customer_data.get(customer_id, {}).get('phone', self.generate_phone())
            
            # Stagger creation times
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                minutes=random.randint(0, 59)
            )
            
            result_id = self.seed_result(
                campaign_id=campaign_id,
                customer_id=customer_id,
                customer_name=name,
                customer_phone=phone,
                created_at=created_at
            )
            result_ids.append(result_id)
        
        self.log(f"✅ Created {len(result_ids)} results for campaign {campaign_id}")
        return result_ids


def run_bulk_result_seeder(db, tenant_id: str = "demo-tenant", campaign_id: str = None, customer_ids: List[str] = None, customer_data: dict = None):
    """Run bulk call result seeder"""
    seeder = BulkCallResultSeeder(db, tenant_id)
    if campaign_id and customer_ids:
        return seeder.seed_for_campaign(campaign_id, customer_ids, customer_data)
    return []
