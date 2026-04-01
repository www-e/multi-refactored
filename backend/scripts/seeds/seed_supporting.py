"""
Supporting Data Seeder
Creates events, handoffs, and approvals for audit trail
"""
from datetime import datetime, timedelta
from typing import List
import random
from app.models import Event, Handoff, Approval
from .base_seeder import BaseSeeder


class SupportingDataSeeder(BaseSeeder):
    """Seeder for supporting data"""
    
    def seed_event(self, event_type: str, payload: dict) -> int:
        """Seed a single event"""
        event = Event(
            type=event_type,
            payload=payload,
            created_at=datetime.utcnow(),
            tenant_id=self.tenant_id
        )
        
        self.db.add(event)
        self.db.commit()
        
        return event.id
    
    def seed_handoff(
        self,
        conversation_id: str,
        from_tier: str = "AI",
        to_tier: str = "Human",
        reason: str = None,
        success: bool = True
    ) -> int:
        """Seed a handoff record"""
        handoff = Handoff(
            conversation_id=conversation_id,
            from_tier=from_tier,
            to_tier=to_tier,
            reason=reason or "تعذر على المساعد الصوتي الإجابة",
            at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            success=success,
            tenant_id=self.tenant_id
        )
        
        self.db.add(handoff)
        self.db.commit()
        
        self.log(f"✅ Created Handoff: {conversation_id} ({from_tier} → {to_tier})")
        return handoff.id
    
    def seed_approval(
        self,
        entity_type: str,
        entity_id: str,
        approver: str,
        status: str = "approved"
    ) -> int:
        """Seed an approval record"""
        approval = Approval(
            entity_type=entity_type,
            entity_id=entity_id,
            approver=approver,
            status=status,
            at=datetime.utcnow(),
            tenant_id=self.tenant_id
        )
        
        self.db.add(approval)
        self.db.commit()
        
        self.log(f"✅ Created Approval: {entity_type}/{entity_id} by {approver}")
        return approval.id
    
    def seed_audit_trail(self, conversation_ids: List[str] = None, ticket_ids: List[str] = None):
        """Seed audit trail events"""
        # Seed some handoffs
        if conversation_ids:
            num_handoffs = min(5, len(conversation_ids))
            for i in range(num_handoffs):
                self.seed_handoff(
                    conversation_id=conversation_ids[i],
                    reason=random.choice([
                        "طلب العميل التحدث لموظف",
                        "استفسار معقد يحتاج مختص",
                        "شكوى من العميل"
                    ])
                )
        
        # Seed some approvals
        if ticket_ids:
            num_approvals = min(3, len(ticket_ids))
            for i in range(num_approvals):
                self.seed_approval(
                    entity_type="ticket",
                    entity_id=ticket_ids[i],
                    approver=f"usr_{i+1}",
                    status="approved"
                )
        
        # Seed general events
        events = [
            ("system_startup", {"version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}),
            ("config_updated", {"setting": "max_concurrent_calls", "value": 10}),
            ("webhook_received", {"source": "elevenlabs", "event": "call_completed"})
        ]
        
        for event_type, payload in events:
            self.seed_event(event_type, payload)
        
        self.log("✅ Created audit trail events")


import random

def run_supporting_seeder(db, tenant_id: str = "demo-tenant", conversation_ids: List[str] = None, ticket_ids: List[str] = None):
    """Run supporting data seeder"""
    seeder = SupportingDataSeeder(db, tenant_id)
    seeder.seed_audit_trail(conversation_ids, ticket_ids)
