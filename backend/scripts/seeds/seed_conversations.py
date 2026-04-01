"""
Conversation Seeder
Creates conversation records that represent the actual call interactions
"""
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.models import Conversation, ChannelEnum, AIOrHumanEnum
from .base_seeder import BaseSeeder


class ConversationSeeder(BaseSeeder):
    """Seeder for conversations"""
    
    def seed_conversation(
        self,
        customer_id: str,
        channel: ChannelEnum = ChannelEnum.voice,
        summary: str = None,
        sentiment: str = None,
        ai_or_human: AIOrHumanEnum = AIOrHumanEnum.AI,
        recording_url: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single conversation"""
        conversation_id = self.generate_id("conv")
        
        created_at = created_at or datetime.utcnow()
        ended_at = created_at + timedelta(seconds=random.randint(60, 600))
        
        # Sentiment distribution: 60% positive, 30% neutral, 10% negative
        if not sentiment:
            sentiment = random.choices(
                ["positive", "neutral", "negative"],
                weights=[60, 30, 10]
            )[0]
        
        conversation = Conversation(
            id=conversation_id,
            tenant_id=self.tenant_id,
            channel=channel,
            customer_id=customer_id,
            summary=summary or "محادثة مع العميل عبر المساعد الصوتي",
            sentiment=sentiment,
            ai_or_human=ai_or_human,
            recording_url=recording_url,
            created_at=created_at,
            ended_at=ended_at,
            retention_expires_at=created_at + timedelta(days=90)  # 90 day retention
        )
        
        self.db.add(conversation)
        self.db.commit()
        
        self.log(f"✅ Created Conversation: {conversation_id}")
        return conversation_id
    
    def seed_bulk(self, count: int = 30, customer_ids: List[str] = None) -> List[str]:
        """Seed multiple conversations"""
        conversation_ids = []
        
        sentiments = ["positive", "positive", "positive", "neutral", "neutral", "negative"]
        
        for i in range(count):
            customer_id = customer_ids[i] if customer_ids and i < len(customer_ids) else None
            
            if not customer_id:
                # If no customer, skip or create anonymous
                self.log(f"⚠️  Skipping conversation {i+1}: No customer ID", "WARN")
                continue
            
            sentiment = random.choice(sentiments)
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23)
            )
            
            conversation_id = self.seed_conversation(
                customer_id=customer_id,
                sentiment=sentiment,
                created_at=created_at
            )
            conversation_ids.append(conversation_id)
        
        self.log(f"✅ Created {len(conversation_ids)} conversations")
        return conversation_ids


def run_conversation_seeder(db, tenant_id: str = "demo-tenant", count: int = 30, customer_ids: List[str] = None):
    """Run conversation seeder"""
    seeder = ConversationSeeder(db, tenant_id)
    return seeder.seed_bulk(count, customer_ids)
