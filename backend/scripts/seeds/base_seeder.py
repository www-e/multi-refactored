"""
Base seeder utility with common functions for all seeders
"""
import sys
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import secrets
import random

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.db import SessionLocal, engine
from sqlalchemy.orm import Session
from sqlalchemy import text


class BaseSeeder:
    """Base class for all seeders with common utilities"""
    
    def __init__(self, db: Session, tenant_id: str = "demo-tenant"):
        self.db = db
        self.tenant_id = tenant_id
    
    def generate_id(self, prefix: str) -> str:
        """Generate a unique ID with prefix"""
        return f"{prefix}_{secrets.token_hex(8)}"
    
    def generate_phone(self, country_code: str = "+966") -> str:
        """Generate a realistic Saudi phone number"""
        # Saudi mobile numbers start with 5
        return f"{country_code}5{random.randint(10000000, 59999999)}"
    
    def generate_email(self, name: str) -> str:
        """Generate email from name"""
        domains = ["gmail.com", "outlook.com", "yahoo.com", "navaia.com"]
        name_part = name.replace(" ", ".").lower()
        # Remove non-ASCII characters but keep only alphanumeric and dots
        name_part = ''.join(c for c in name_part if c.isalnum() or c == '.')
        # Remove leading/trailing periods and consecutive periods
        name_part = name_part.strip('.')
        name_part = '.'.join(part for part in name_part.split('.') if part)
        # If nothing valid remains, generate a random user ID
        if not name_part:
            name_part = f"user{random.randint(1000, 9999)}"
        domain = random.choice(domains)
        return f"{name_part}@{domain}"
    
    def random_date(self, start_date: datetime, end_date: datetime) -> datetime:
        """Generate a random date between start and end"""
        delta = end_date - start_date
        random_days = random.randint(0, delta.days)
        return start_date + timedelta(days=random_days)
    
    def random_datetime(self, start_date: datetime, end_date: datetime) -> datetime:
        """Generate a random datetime between start and end"""
        delta = end_date - start_date
        random_seconds = random.randint(0, int(delta.total_seconds()))
        return start_date + timedelta(seconds=random_seconds)
    
    def truncate_table(self, table_name: str):
        """Truncate a table (use with caution)"""
        self.db.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
        self.db.commit()
    
    def log(self, message: str, level: str = "INFO"):
        """Log a message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")


class SeededData:
    """Container for seeded data to be used across seeders"""
    
    def __init__(self):
        self.user_ids: List[str] = []
        self.customer_ids: List[str] = []
        self.voice_session_ids: List[str] = []
        self.conversation_ids: List[str] = []
        self.call_ids: List[str] = []
        self.booking_ids: List[str] = []
        self.ticket_ids: List[str] = []
        self.script_ids: List[str] = []
        self.bulk_campaign_ids: List[str] = []
        self.bulk_result_ids: List[str] = []
        self.organization_ids: List[str] = []
        self.campaign_ids: List[str] = []
    
    def add(self, entity_type: str, id: str):
        """Add an ID to the appropriate list"""
        attr = f"{entity_type}_ids"
        if hasattr(self, attr):
            getattr(self, attr).append(id)
    
    def get_random(self, entity_type: str) -> Optional[str]:
        """Get a random ID from an entity type"""
        attr = f"{entity_type}_ids"
        if hasattr(self, attr):
            ids = getattr(self, attr)
            return random.choice(ids) if ids else None
        return None


# Arabic data for realistic seeding
ARABIC_NAMES = [
    "محمد أحمد", "فاطمة علي", "عبدالله عمر", "نورة سعد", "خالد Ibrahim",
    "سارة محمود", "فيصل خالد", "ريم عبدالله", "تركي محمد", "ليلى حسن",
    "عمر فاروق", "مريم يوسف", "سلطان فهد", "هند عبدالعزيز", "ماجد عبدالله",
    "الجوهرة سعود", "ناصر الحربي", "عبير محمد", "حمزة علي", "زينب أحمد",
    "ياسر القحطاني", "نوف السليمان", "بدر المطيري", "لولوة الناصر", "طلال العتيبي",
    "هيا المنصور", "مشعل الراشد", "جواهر الدوسري", "وليد الزهراني", "أماني الغامدي"
]

ARABIC_FIRST_NAMES = [
    "محمد", "أحمد", "عبدالله", "خالد", "فيصل", "تركي", "ماجد", "ناصر", "حمزة", "ياسر",
    "فاطمة", "نورة", "سارة", "ريم", "ليلى", "مريم", "هند", "الجوهرة", "عبير", "زينب",
    "عمر", "سعد", "محمود", "يوسف", "فهد", "عزيز", "بدر", "وليد", "مشعل", "طلال"
]

ARABIC_LAST_NAMES = [
    "أحمد", "علي", "عمر", "سعد", "خالد", "محمود", "العمري", "الحربي", "القحطاني",
    "المطيري", "العتيبي", "الدوسري", "الزهراني", "الغامدي", "السليمان", "الناصر",
    "الراشد", "المنصور", "الفهد", "العبداللطيف"
]

NEIGHBORHOODS = [
    "حي الملقا",
    "حي التعاون", 
    "حي حطين",
    "حي الندى",
    "حي قرطبة",
    "حي القيروان",
    "حي النرجس"
]

PROJECT_NAMES = [
    "مشروع النخيل",
    "مجمع الزهور",
    "فلل الياسمين",
    "أبراج الرياض",
    "قصور الملقا",
    "مساكن التعاون",
    " residences حطين"
]

TICKET_CATEGORIES = [
    "سباكة",
    "كهرباء", 
    "مفاتيح",
    "تنظيف",
    "تكييف",
    "نظافة",
    "صيانة عامة"
]

INTENTS = [
    "استعلام_توافر",
    "استعلام_سعر",
    "حجز_زيارة",
    "انشاء_حجز",
    "الغاء_حجز",
    "تجديد",
    "تذكرة_صيانة",
    "سؤال_عام",
    "تأهيل_عميل",
    "بيع_إضافي"
]

SCRIPT_TEMPLATES = {
    "marketing": """# نص تسويقي - مشروع {project_name}

## الترحيب
مرحباً {customer_name}، معك {agent_name} من شركة نفاية للعقارات.

## العرض
اتصل عليك بخصوص مشروعنا الجديد في {neighborhood}، لدينا وحدات سكنية مميزة starting from {price} ريال.

## الأسئلة المتوقعة
- ما هي المساحات المتاحة؟
- ما هي طرق الدفع؟
- متى التسليم؟

## الإغلاق
هل تود حجز زيارة للموقع؟""",

    "support": """# نص دعم فني

## الترحيب
مرحباً {customer_name}، معك فريق الدعم من نفاية.

## الاستفسار
كيف يمكنني مساعدتك اليوم بخصوص {issue_type}؟

## الحلول
[اتبع خطوات الحل حسب المشكلة]

## المتابعة
هل هناك أي شيء آخر يمكنني مساعدتك به؟""",

    "renewal": """# نص تجديد عقد

## الترحيب
مرحباً {customer_name}، معك {agent_name} من نفاية.

## التذكير
عقد الإيجار الخاص بك في {project_name} سينتهي خلال {months} أشهر.

## العرض
نود تجديد العقد بنفس الشروط أو مناقشة الشروط الجديدة.

## الإغلاق
ما هو رأيك في التجديد؟""",

    "general": """# نص عام للاستفسارات

## الترحيب
مرحباً بك في نفاية للعقارات، معك {agent_name}.

## الاستفسار
كيف يمكنني مساعدتك اليوم؟

## التوجيه
[توجيه للعميل حسب الاستفسار]

## الختام
شكراً لتواصلك معنا."""
}
