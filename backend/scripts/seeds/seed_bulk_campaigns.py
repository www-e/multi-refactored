"""
Bulk Call Campaign Seeder
Creates bulk calling campaigns
"""
from datetime import datetime, timedelta
from typing import List
import random
from app.models import BulkCallCampaign, BulkCallStatusEnum
from .base_seeder import BaseSeeder


class BulkCallCampaignSeeder(BaseSeeder):
    """Seeder for bulk call campaigns"""
    
    def seed_campaign(
        self,
        name: str,
        customer_ids: List[str],
        script_id: str,
        script_content: str,
        agent_type: str = "sales",
        status: BulkCallStatusEnum = BulkCallStatusEnum.queued,
        concurrency_limit: int = 3,
        use_knowledge_base: bool = True,
        custom_system_prompt: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single bulk call campaign"""
        campaign_id = self.generate_id("campaign")
        
        created_at = created_at or datetime.utcnow()
        total_calls = len(customer_ids)
        
        # Calculate progress based on status
        completed = 0
        failed = 0
        successful = 0
        
        if status == BulkCallStatusEnum.completed:
            completed = total_calls
            successful = int(total_calls * 0.7)  # 70% success rate
            failed = total_calls - successful
            completed_at = created_at + timedelta(hours=2)
        elif status == BulkCallStatusEnum.running:
            completed = int(total_calls * 0.5)  # 50% complete
            successful = int(completed * 0.7)
            failed = completed - successful
            started_at = created_at - timedelta(hours=1)
            completed_at = None
        else:
            started_at = None
            completed_at = None
        
        campaign = BulkCallCampaign(
            id=campaign_id,
            tenant_id=self.tenant_id,
            name=name,
            status=status,
            customer_ids=customer_ids,
            total_calls=total_calls,
            completed_calls=completed,
            failed_calls=failed,
            successful_calls=successful,
            script_id=script_id,
            script_content=script_content,
            agent_type=agent_type,
            concurrency_limit=concurrency_limit,
            use_knowledge_base=use_knowledge_base,
            custom_system_prompt=custom_system_prompt,
            created_at=created_at,
            started_at=started_at if status == BulkCallStatusEnum.running else None,
            completed_at=completed_at if status == BulkCallStatusEnum.completed else None
        )
        
        self.db.add(campaign)
        self.db.commit()
        
        self.log(f"✅ Created Campaign: {campaign_id} ({name}) - {total_calls} calls")
        return campaign_id
    
    def seed_multiple(self, count: int = 5, customer_ids: List[str] = None, script_id: str = None, script_content: str = None) -> List[str]:
        """Seed multiple campaigns"""
        campaign_ids = []
        
        if not customer_ids or len(customer_ids) < 10:
            self.log("⚠️  Need at least 10 customer IDs for campaigns", "WARN")
            return campaign_ids
        
        if not script_id or not script_content:
            self.log("⚠️  Need script_id and script_content", "WARN")
            return campaign_ids
        
        statuses = [
            BulkCallStatusEnum.completed,
            BulkCallStatusEnum.completed,
            BulkCallStatusEnum.running,
            BulkCallStatusEnum.queued,
            BulkCallStatusEnum.paused
        ]
        
        campaign_names = [
            "حملة تسويقية - الربع الأول",
            "حملة تجديد العقود",
            "حملة عملاء جدد",
            "حملة استطلاع رضا",
            "حملة تعريف بالخدمات"
        ]
        
        for i in range(count):
            # Select random subset of customers for each campaign
            num_customers = random.randint(10, min(30, len(customer_ids)))
            selected_customers = random.sample(customer_ids, num_customers)
            
            status = statuses[i % len(statuses)]
            name = campaign_names[i % len(campaign_names)]
            
            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 30))
            
            campaign_id = self.seed_campaign(
                name=name,
                customer_ids=selected_customers,
                script_id=script_id,
                script_content=script_content,
                agent_type=random.choice(["sales", "support"]),
                status=status,
                created_at=created_at
            )
            campaign_ids.append(campaign_id)
        
        self.log(f"✅ Created {count} bulk call campaigns")
        return campaign_ids


import random

def run_bulk_campaign_seeder(db, tenant_id: str = "demo-tenant", count: int = 5, customer_ids: List[str] = None, script_id: str = None, script_content: str = None):
    """Run bulk call campaign seeder"""
    seeder = BulkCallCampaignSeeder(db, tenant_id)
    return seeder.seed_multiple(count, customer_ids, script_id, script_content)
