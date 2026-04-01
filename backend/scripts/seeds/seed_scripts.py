"""
Bulk Call Script Seeder
Creates reusable scripts for bulk calling campaigns
"""
from datetime import datetime
from typing import List
import random
from app.models import BulkCallScript
from .base_seeder import BaseSeeder, SCRIPT_TEMPLATES


class BulkCallScriptSeeder(BaseSeeder):
    """Seeder for bulk call scripts"""
    
    def seed_script(
        self,
        name: str,
        content: str,
        agent_type: str = "sales",
        category: str = "general",
        description: str = None,
        variables: List[str] = None,
        tags: List[str] = None,
        is_template: bool = False,
        is_active: bool = True,
        created_by: str = "system"
    ) -> str:
        """Seed a single script"""
        script_id = self.generate_id("script")
        
        script = BulkCallScript(
            id=script_id,
            tenant_id=self.tenant_id,
            name=name,
            description=description,
            content=content,
            variables=variables or [],
            agent_type=agent_type,
            category=category,
            tags=tags or [],
            usage_count=0,
            last_used_at=None,
            created_by=created_by,
            is_template=is_template,
            is_active=is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(script)
        self.db.commit()
        
        self.log(f"✅ Created Script: {script_id} ({name}) - {category}")
        return script_id
    
    def seed_templates(self) -> List[str]:
        """Seed default script templates"""
        script_ids = []
        
        # Marketing Script
        script_id = self.seed_script(
            name="حملة تسويقية - مشروع جديد",
            content=SCRIPT_TEMPLATES["marketing"],
            agent_type="sales",
            category="marketing",
            description="نص تسويقي للإعلان عن مشاريع جديدة",
            variables=["customer_name", "agent_name", "project_name", "neighborhood", "price"],
            tags=["تسويق", "مبيعات", "مشروع جديد"],
            is_template=True
        )
        script_ids.append(script_id)
        
        # Support Script
        script_id = self.seed_script(
            name="دعم فني - استفسار عام",
            content=SCRIPT_TEMPLATES["support"],
            agent_type="support",
            category="support",
            description="نص لدعم الفني والاستفسارات",
            variables=["customer_name", "issue_type"],
            tags=["دعم", "صيانة", "استفسار"],
            is_template=True
        )
        script_ids.append(script_id)
        
        # Renewal Script
        script_id = self.seed_script(
            name="تجديد عقود إيجار",
            content=SCRIPT_TEMPLATES["renewal"],
            agent_type="sales",
            category="renewal",
            description="نص للتواصل مع المستأجرين لتجديد العقود",
            variables=["customer_name", "agent_name", "project_name", "months"],
            tags=["تجديد", "عقود", "إيجار"],
            is_template=True
        )
        script_ids.append(script_id)
        
        # General Script
        script_id = self.seed_script(
            name="نص عام للاستفسارات",
            content=SCRIPT_TEMPLATES["general"],
            agent_type="support",
            category="general",
            description="نص عام للرد على الاستفسارات المتنوعة",
            variables=["customer_name", "agent_name"],
            tags=["عام", "استفسار"],
            is_template=True
        )
        script_ids.append(script_id)
        
        # Custom Sales Script
        custom_sales = """# نص مبيعات متقدم

## المقدمة
مرحباً {customer_name}، معك {agent_name} من نفاية للعقارات. كيف حالك؟

## التأهيل
- ما هي احتياجاتك السكنية؟
- ما هي ميزانيتك المتوقعة؟
- متى تود الانتقال؟

## العرض
بناءً على احتياجاتك، أرشح لك:
- {property_option_1}
- {property_option_2}

## التعامل مع الاعتراضات
[الإجابة على الأسئلة الشائعة]

## الإغلاق
هل تود حجز زيارة؟"""

        script_id = self.seed_script(
            name="مبيعات متقدم - تأهيل عملاء",
            content=custom_sales,
            agent_type="sales",
            category="marketing",
            description="نص متقدم لتأهيل العملاء المحتملين",
            variables=["customer_name", "agent_name", "property_option_1", "property_option_2"],
            tags=["مبيعات", "تأهيل", "متقدم"],
            is_template=False
        )
        script_ids.append(script_id)
        
        self.log(f"✅ Created {len(script_ids)} script templates")
        return script_ids


def run_script_seeder(db, tenant_id: str = "demo-tenant"):
    """Run script seeder"""
    seeder = BulkCallScriptSeeder(db, tenant_id)
    return seeder.seed_templates()
