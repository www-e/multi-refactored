"""
Ticket Seeder
Creates support ticket records
"""
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.models import Ticket, TicketPriorityEnum, TicketStatusEnum
from .base_seeder import BaseSeeder, TICKET_CATEGORIES, PROJECT_NAMES


class TicketSeeder(BaseSeeder):
    """Seeder for tickets"""
    
    def seed_ticket(
        self,
        customer_id: str,
        session_id: Optional[str] = None,
        priority: TicketPriorityEnum = None,
        category: str = None,
        status: TicketStatusEnum = None,
        issue: str = None,
        project: str = None,
        customer_name: str = None,
        phone: str = None,
        assignee: str = None,
        sla_due_at: datetime = None,
        resolution_note: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single ticket"""
        ticket_id = self.generate_id("tkt")
        
        created_at = created_at or datetime.utcnow()
        
        # Priority distribution: 40% low, 35% med, 20% high, 5% urgent
        if not priority:
            priority = random.choices(
                [TicketPriorityEnum.low, TicketPriorityEnum.med, TicketPriorityEnum.high, TicketPriorityEnum.urgent],
                weights=[40, 35, 20, 5]
            )[0]
        
        # Status distribution
        if not status:
            status = random.choices(
                [TicketStatusEnum.open, TicketStatusEnum.in_progress, TicketStatusEnum.resolved],
                weights=[40, 35, 25]
            )[0]
        
        category = category or random.choice(TICKET_CATEGORIES)
        project = project or random.choice(PROJECT_NAMES)
        issue = issue or self._generate_issue(category)
        
        # SLA based on priority
        if not sla_due_at:
            sla_hours = {
                TicketPriorityEnum.urgent: 4,
                TicketPriorityEnum.high: 24,
                TicketPriorityEnum.med: 48,
                TicketPriorityEnum.low: 72
            }
            sla_due_at = created_at + timedelta(hours=sla_hours[priority])
        
        ticket = Ticket(
            id=ticket_id,
            tenant_id=self.tenant_id,
            customer_id=customer_id,
            session_id=session_id,
            priority=priority,
            category=category,
            status=status,
            issue=issue,
            project=project,
            customer_name=customer_name,
            phone=phone,
            assignee=assignee,
            sla_due_at=sla_due_at,
            resolution_note=resolution_note,
            created_at=created_at
        )
        
        self.db.add(ticket)
        self.db.commit()
        
        self.log(f"✅ Created Ticket: {ticket_id} ({category}, {priority.value}) - {status.value}")
        return ticket_id
    
    def seed_bulk(self, count: int = 15, customer_ids: List[str] = None, session_ids: List[str] = None) -> List[str]:
        """Seed multiple tickets"""
        ticket_ids = []
        
        for i in range(count):
            customer_id = customer_ids[i] if customer_ids and i < len(customer_ids) else None
            
            if not customer_id:
                self.log(f"⚠️  Skipping ticket {i+1}: No customer ID", "WARN")
                continue
            
            session_id = session_ids[i] if session_ids and i < len(session_ids) else None
            category = random.choice(TICKET_CATEGORIES)
            
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 45),
                hours=random.randint(0, 23)
            )
            
            # Generate resolution note for resolved tickets
            status = random.choices(
                [TicketStatusEnum.open, TicketStatusEnum.in_progress, TicketStatusEnum.resolved],
                weights=[40, 35, 25]
            )[0]
            
            resolution_note = None
            if status == TicketStatusEnum.resolved:
                resolution_note = random.choice([
                    "تم حل المشكلة بنجاح",
                    "تمت الصيانة في الموقع",
                    "تم استبدال القطعة المعطوبة",
                    "تم التنسيق مع المقاول",
                    "أغلقت بعد موافقة العميل"
                ])
            
            ticket_id = self.seed_ticket(
                customer_id=customer_id,
                session_id=session_id,
                category=category,
                status=status,
                resolution_note=resolution_note,
                created_at=created_at
            )
            ticket_ids.append(ticket_id)
        
        self.log(f"✅ Created {count} tickets")
        return ticket_ids
    
    def _generate_issue(self, category: str) -> str:
        """Generate realistic issue description based on category"""
        issues = {
            "سباكة": [
                "تسريب مياه في الحمام",
                "انسداد في المجاري",
                "صنبور مكسور في المطبخ",
                "ضعف ضغط المياه"
            ],
            "كهرباء": [
                "انقطاع الكهرباء في الغرفة",
                "تمديدات كهربائية تالفة",
                "مفتاح كهرباء لا يعمل",
                "شرارة كهربائية في المطبخ"
            ],
            "مفاتيح": [
                "مفتاح الباب الرئيسي تالف",
                "قفل النافذة لا يعمل",
                "مفتاح الغرفة مكسور"
            ],
            "تنظيف": [
                "تنظيف عام للشقة",
                "تنظيف المكيفات",
                "إزالة بقع من السجاد"
            ],
            "تكييف": [
                "المكيف لا يبرد بشكل جيد",
                "صوت عالي من المكيف",
                "تسريب مياه من المكيف"
            ],
            "صيانة عامة": [
                "أعمال صيانة عامة مطلوبة",
                "فحص شامل للوحدة",
                "إصلاحات متنوعة"
            ]
        }
        return random.choice(issues.get(category, ["مشكلة عامة تحتاج فحص"]))


def run_ticket_seeder(db, tenant_id: str = "demo-tenant", count: int = 15, customer_ids: List[str] = None, session_ids: List[str] = None):
    """Run ticket seeder"""
    seeder = TicketSeeder(db, tenant_id)
    return seeder.seed_bulk(count, customer_ids, session_ids)
