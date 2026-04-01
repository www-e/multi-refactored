"""
Call Seeder
Creates call records linked to conversations
"""
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.models import Call, CallDirectionEnum, CallStatusEnum, CallOutcomeEnum, AIOrHumanEnum
from .base_seeder import BaseSeeder


class CallSeeder(BaseSeeder):
    """Seeder for calls"""
    
    def seed_call(
        self,
        conversation_id: str,
        direction: CallDirectionEnum = CallDirectionEnum.inbound,
        status: CallStatusEnum = CallStatusEnum.connected,
        outcome: CallOutcomeEnum = None,
        handle_sec: int = None,
        ai_or_human: AIOrHumanEnum = AIOrHumanEnum.AI,
        recording_url: str = None,
        created_at: datetime = None
    ) -> str:
        """Seed a single call"""
        call_id = self.generate_id("call")
        
        created_at = created_at or datetime.utcnow()
        handle_sec = handle_sec or random.randint(30, 600)  # 30 sec to 10 min
        
        # Outcome distribution based on status
        if not outcome:
            if status == CallStatusEnum.no_answer:
                outcome = None
            elif status == CallStatusEnum.abandoned:
                outcome = None
            else:
                outcome = random.choices(
                    [CallOutcomeEnum.qualified, CallOutcomeEnum.booked, CallOutcomeEnum.ticket, CallOutcomeEnum.info],
                    weights=[30, 20, 25, 25]
                )[0]
        
        call = Call(
            id=call_id,
            tenant_id=self.tenant_id,
            conversation_id=conversation_id,
            direction=direction,
            status=status,
            handle_sec=handle_sec,
            outcome=outcome,
            ai_or_human=ai_or_human,
            recording_url=recording_url,
            retention_expires_at=created_at + timedelta(days=90),
            created_at=created_at
        )
        
        self.db.add(call)
        self.db.commit()
        
        self.log(f"✅ Created Call: {call_id} ({direction.value}, {status.value})")
        return call_id
    
    def seed_bulk(self, count: int = 30, conversation_ids: List[str] = None) -> List[str]:
        """Seed multiple calls"""
        call_ids = []
        
        # Status distribution: 85% connected, 10% no_answer, 5% abandoned
        statuses = [
            CallStatusEnum.connected, CallStatusEnum.connected, CallStatusEnum.connected,
            CallStatusEnum.connected, CallStatusEnum.connected, CallStatusEnum.connected,
            CallStatusEnum.connected, CallStatusEnum.connected, CallStatusEnum.no_answer,
            CallStatusEnum.abandoned
        ]
        
        directions = [
            CallDirectionEnum.inbound, CallDirectionEnum.inbound,
            CallDirectionEnum.inbound, CallDirectionEnum.outbound
        ]  # 75% inbound
        
        for i in range(count):
            conversation_id = conversation_ids[i] if conversation_ids and i < len(conversation_ids) else None
            
            if not conversation_id:
                self.log(f"⚠️  Skipping call {i+1}: No conversation ID", "WARN")
                continue
            
            status = random.choice(statuses)
            direction = random.choice(directions)
            
            # Create in the past
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Some calls have recording URLs (simulated)
            has_recording = random.choice([True, True, True, False])  # 75% have recordings
            recording_url = f"https://recordings.navaia.sa/call_{call_id}.mp3" if has_recording else None
            
            call_id = self.seed_call(
                conversation_id=conversation_id,
                status=status,
                direction=direction,
                created_at=created_at,
                recording_url=recording_url
            )
            call_ids.append(call_id)
        
        self.log(f"✅ Created {count} calls")
        return call_ids


def run_call_seeder(db, tenant_id: str = "demo-tenant", count: int = 30, conversation_ids: List[str] = None):
    """Run call seeder"""
    seeder = CallSeeder(db, tenant_id)
    return seeder.seed_bulk(count, conversation_ids)
