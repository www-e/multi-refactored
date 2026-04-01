"""
Voice Session Seeder
Creates voice sessions that represent ElevenLabs AI call sessions
"""
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.models import VoiceSession, VoiceSessionStatus
from .base_seeder import BaseSeeder, INTENTS


class VoiceSessionSeeder(BaseSeeder):
    """Seeder for voice sessions"""
    
    def seed_session(
        self,
        customer_id: Optional[str],
        customer_phone: str,
        conversation_id: str = None,
        agent_id: str = None,
        agent_name: str = None,
        status: VoiceSessionStatus = VoiceSessionStatus.COMPLETED,
        direction: str = "inbound",
        intent: str = None,
        summary: str = None,
        simulation: bool = False,
        created_at: datetime = None
    ) -> str:
        """Seed a single voice session"""
        session_id = self.generate_id("vs")
        conversation_id = conversation_id or f"conv_{self.generate_id('')}"
        
        # Default agents
        if not agent_id:
            agent_id = "agent_support_001" if agent_name == "support" else "agent_sales_001"
        if not agent_name:
            agent_name = "دعم" if "support" in agent_id else "مبيعات"
        
        created_at = created_at or datetime.utcnow()
        started_at = created_at + timedelta(seconds=random.randint(5, 30))
        ended_at = started_at + timedelta(seconds=random.randint(60, 600))  # 1-10 min call
        
        if status == VoiceSessionStatus.ACTIVE:
            ended_at = None
        elif status == VoiceSessionStatus.FAILED:
            ended_at = started_at + timedelta(seconds=random.randint(5, 30))
        
        session = VoiceSession(
            id=session_id,
            tenant_id=self.tenant_id,
            customer_id=customer_id,
            direction=direction,
            status=status,
            locale="ar-SA",
            created_at=created_at,
            started_at=started_at,
            ended_at=ended_at,
            conversation_id=conversation_id,
            agent_name=agent_name,
            agent_id=agent_id,
            customer_phone=customer_phone,
            summary=summary or self._generate_summary(intent),
            extracted_intent=intent or random.choice(INTENTS),
            simulation=simulation
        )
        
        self.db.add(session)
        self.db.commit()
        
        self.log(f"✅ Created Voice Session: {session_id} ({customer_phone})")
        return session_id
    
    def seed_bulk(self, count: int = 30, customer_data: List[dict] = None) -> List[str]:
        """
        Seed multiple voice sessions
        customer_data: List of dicts with 'customer_id' and 'phone'
        """
        session_ids = []
        
        statuses = [
            VoiceSessionStatus.COMPLETED,  # 80%
            VoiceSessionStatus.COMPLETED,
            VoiceSessionStatus.COMPLETED,
            VoiceSessionStatus.COMPLETED,
            VoiceSessionStatus.ACTIVE,     # 10%
            VoiceSessionStatus.FAILED      # 10%
        ]
        
        directions = ["inbound", "inbound", "inbound", "outbound"]  # 75% inbound
        
        for i in range(count):
            if customer_data and i < len(customer_data):
                customer_id = customer_data[i].get('customer_id')
                phone = customer_data.get('phone', customer_data[i].get('customer_phone'))
            else:
                customer_id = None
                phone = self.generate_phone()
            
            status = random.choice(statuses)
            direction = random.choice(directions)
            intent = random.choice(INTENTS)
            
            # Generate realistic summary based on intent
            summary = self._generate_summary(intent)
            
            # Create session in the past
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            session_id = self.seed_session(
                customer_id=customer_id,
                customer_phone=phone,
                status=status,
                direction=direction,
                intent=intent,
                summary=summary,
                created_at=created_at
            )
            session_ids.append(session_id)
        
        self.log(f"✅ Created {count} voice sessions")
        return session_ids
    
    def _generate_summary(self, intent: str) -> str:
        """Generate realistic call summary based on intent"""
        summaries = {
            "استعلام_توافر": "استفسر العميل عن توافر وحدات سكنية في المشروع. تم تقديم المعلومات المطلوبة.",
            "استعلام_سعر": "سؤال عن الأسعار وطرق الدفع. تم شرح خيارات التقسيط.",
            "حجز_زيارة": "رغبة في حجز زيارة للموقع. تم تنسيق موعد الزيارة.",
            "انشاء_حجز": "رغبة في الحجز. تم شرح الإجراءات المطلوبة.",
            "الغاء_حجز": "طلب إلغاء الحجز. تم تحويله للفريق المختص.",
            "تجديد": "استفسار عن تجديد العقد. تم شرح خيارات التجديد.",
            "تذكرة_صيانة": "بلاغ عن مشكلة تحتاج صيانة. تم إنشاء تذكرة.",
            "سؤال_عام": "استفسار عام عن الخدمات. تم تقديم المعلومات.",
            "تأهيل_عميل": "تم تأهيل العميل وجمع المتطلبات الأساسية.",
            "بيع_إضافي": "عرض خدمات إضافية. العميل مهتم."
        }
        return summaries.get(intent, "مكالمة عامة تم التعامل معها بنجاح")


import random

def run_voice_session_seeder(db, tenant_id: str = "demo-tenant", count: int = 30, customer_data: List[dict] = None):
    """Run voice session seeder"""
    seeder = VoiceSessionSeeder(db, tenant_id)
    return seeder.seed_bulk(count, customer_data)
