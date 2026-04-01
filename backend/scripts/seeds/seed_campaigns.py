"""
Campaign and Campaign Metrics Seeder
Creates legacy campaigns and their metrics
"""
from datetime import datetime, timedelta
from typing import List
import random
from app.models import Campaign, CampaignMetrics, CampaignTypeEnum
from .base_seeder import BaseSeeder


class CampaignSeeder(BaseSeeder):
    """Seeder for campaigns"""
    
    def seed_campaign(self, name: str, objective: str = None, status: str = "active") -> str:
        """Seed a single campaign"""
        campaign_id = self.generate_id("camp")
        
        objective = objective or random.choice([
            "حجوزات",
            "تجديدات",
            "تحصيل_عملاء",
            "بيع_إضافي"
        ])
        
        campaign = Campaign(
            id=campaign_id,
            tenant_id=self.tenant_id,
            name=name,
            type=CampaignTypeEnum.voice,
            objective=objective,
            status=status,
            audience_query={"neighborhoods": ["حي الملقا", "حي حطين"]},
            schedule={"start_time": "09:00", "end_time": "17:00"},
            created_at=datetime.utcnow()
        )
        
        self.db.add(campaign)
        self.db.commit()
        
        self.log(f"✅ Created Campaign: {campaign_id} ({name})")
        return campaign_id
    
    def seed_with_metrics(self, count: int = 3) -> List[str]:
        """Seed campaigns with metrics"""
        campaign_ids = []
        
        names = [
            "حملة الربع الأول",
            "حملة الصيف التسويقية",
            "حملة العملاء المميزين"
        ]
        
        for i in range(count):
            name = names[i % len(names)]
            status = random.choice(["active", "active", "completed"])
            
            campaign_id = self.seed_campaign(name, status=status)
            campaign_ids.append(campaign_id)
            
            # Seed metrics for this campaign
            self._seed_metrics(campaign_id)
        
        self.log(f"✅ Created {count} campaigns with metrics")
        return campaign_ids
    
    def _seed_metrics(self, campaign_id: str):
        """Seed metrics for a campaign"""
        base_date = datetime.utcnow() - timedelta(days=30)
        
        for day in range(30):
            ts = base_date + timedelta(days=day)
            
            # Simulate growing metrics
            multiplier = (day + 1) / 30
            
            reached = int(random.randint(50, 100) * multiplier)
            engaged = int(reached * random.uniform(0.6, 0.8))
            qualified = int(engaged * random.uniform(0.4, 0.6))
            booked = int(qualified * random.uniform(0.3, 0.5))
            revenue_sar = booked * random.uniform(50000, 100000)
            roas = revenue_sar / (reached * 10) if reached > 0 else 0
            
            metric = CampaignMetrics(
                campaign_id=campaign_id,
                tenant_id=self.tenant_id,
                ts=ts,
                reached=reached,
                engaged=engaged,
                qualified=qualified,
                booked=booked,
                revenue_sar=revenue_sar,
                roas=roas
            )
            
            self.db.add(metric)
        
        self.db.commit()


def run_campaign_seeder(db, tenant_id: str = "demo-tenant", count: int = 3):
    """Run campaign seeder"""
    seeder = CampaignSeeder(db, tenant_id)
    return seeder.seed_with_metrics(count)
