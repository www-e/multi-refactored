"""
Master Seed Orchestrator
Orchestrates the complete database seeding process with proper dependency order
"""
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import SessionLocal
from app.models import Customer
from .base_seeder import SeededData

# Import all seeders
from .seed_organizations import run_organization_seeder
from .seed_users import run_user_seeder
from .seed_customers import run_customer_seeder
from .seed_voice_sessions import run_voice_session_seeder
from .seed_conversations import run_conversation_seeder
from .seed_calls import run_call_seeder
from .seed_bookings import run_booking_seeder
from .seed_tickets import run_ticket_seeder
from .seed_scripts import run_script_seeder
from .seed_bulk_campaigns import run_bulk_campaign_seeder
from .seed_bulk_results import run_bulk_result_seeder
from .seed_campaigns import run_campaign_seeder
from .seed_supporting import run_supporting_seeder


class SeedOrchestrator:
    """Orchestrates the complete seeding process"""
    
    def __init__(self, tenant_id: str = "demo-tenant"):
        self.tenant_id = tenant_id
        self.db = None
        self.seed_data = SeededData()
        self.results: Dict[str, Any] = {}
    
    def start(self):
        """Start the seeding process"""
        print("\n" + "="*80)
        print("🌱 AGENTIC NAVAIA - DATABASE SEEDING")
        print("="*80)
        print(f"📍 Tenant ID: {self.tenant_id}")
        print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        try:
            self.db = SessionLocal()
            
            # Phase 1: Foundation (Organizations & Users)
            self._phase_1_foundation()
            
            # Phase 2: Core Data (Customers)
            self._phase_2_core_data()
            
            # Phase 3: Voice Interactions (Sessions, Conversations, Calls)
            self._phase_3_voice_interactions()
            
            # Phase 4: Business Outcomes (Bookings & Tickets)
            self._phase_4_business_outcomes()
            
            # Phase 5: Bulk Calling Feature (Scripts, Campaigns, Results)
            self._phase_5_bulk_calling()
            
            # Phase 6: Legacy & Supporting Data
            self._phase_6_supporting_data()
            
            # Summary
            self._print_summary()
            
        except Exception as e:
            print(f"\n❌ SEEDING FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            if self.db:
                self.db.rollback()
            return False
        finally:
            if self.db:
                self.db.close()
        
        return True
    
    def _phase_1_foundation(self):
        """Phase 1: Foundation - Organizations & Users"""
        print("\n" + "="*80)
        print("📌 PHASE 1: Foundation (Organizations & Users)")
        print("="*80)
        
        # Organizations
        org_ids = run_organization_seeder(self.db, self.tenant_id)
        self.seed_data.organization_ids = org_ids
        
        # Users (1 admin + 5 regular users)
        user_ids = run_user_seeder(self.db, self.tenant_id, user_count=5, admin_count=1)
        self.seed_data.user_ids = user_ids
        
        print("\n✅ Phase 1 Complete: Foundation seeded")
    
    def _phase_2_core_data(self):
        """Phase 2: Core Data - Customers"""
        print("\n" + "="*80)
        print("📌 PHASE 2: Core Data (Customers)")
        print("="*80)
        
        # Customers (50 customers for realistic data)
        customer_ids = run_customer_seeder(self.db, self.tenant_id, count=50)
        self.seed_data.customer_ids = customer_ids
        
        print("\n✅ Phase 2 Complete: Customers seeded")
    
    def _phase_3_voice_interactions(self):
        """Phase 3: Voice Interactions - Sessions, Conversations, Calls"""
        print("\n" + "="*80)
        print("📌 PHASE 3: Voice Interactions (Sessions, Conversations, Calls)")
        print("="*80)
        
        # Prepare customer data for voice sessions
        customer_data = []
        for i, cust_id in enumerate(self.seed_data.customer_ids[:30]):
            # Get customer from DB
            from app.models import Customer
            customer = self.db.query(Customer).filter(Customer.id == cust_id).first()
            if customer:
                customer_data.append({
                    'customer_id': cust_id,
                    'phone': customer.phone
                })
        
        # Voice Sessions (30 sessions linked to customers)
        voice_session_ids = run_voice_session_seeder(
            self.db, self.tenant_id, count=30, customer_data=customer_data
        )
        self.seed_data.voice_session_ids = voice_session_ids
        
        # Conversations (linked to customers)
        conversation_ids = run_conversation_seeder(
            self.db, self.tenant_id, count=30, customer_ids=self.seed_data.customer_ids[:30]
        )
        self.seed_data.conversation_ids = conversation_ids
        
        # Calls (linked to conversations)
        call_ids = run_call_seeder(
            self.db, self.tenant_id, count=30, conversation_ids=conversation_ids
        )
        self.seed_data.call_ids = call_ids
        
        print("\n✅ Phase 3 Complete: Voice interactions seeded")
    
    def _phase_4_business_outcomes(self):
        """Phase 4: Business Outcomes - Bookings & Tickets"""
        print("\n" + "="*80)
        print("📌 PHASE 4: Business Outcomes (Bookings & Tickets)")
        print("="*80)
        
        # Bookings (20 bookings from customers)
        booking_ids = run_booking_seeder(
            self.db, self.tenant_id, count=20,
            customer_ids=self.seed_data.customer_ids[:20],
            session_ids=self.seed_data.voice_session_ids[:20]
        )
        self.seed_data.booking_ids = booking_ids
        
        # Tickets (15 tickets from customers)
        ticket_ids = run_ticket_seeder(
            self.db, self.tenant_id, count=15,
            customer_ids=self.seed_data.customer_ids[:15],
            session_ids=self.seed_data.voice_session_ids[:15]
        )
        self.seed_data.ticket_ids = ticket_ids
        
        print("\n✅ Phase 4 Complete: Business outcomes seeded")
    
    def _phase_5_bulk_calling(self):
        """Phase 5: Bulk Calling Feature"""
        print("\n" + "="*80)
        print("📌 PHASE 5: Bulk Calling Feature (Scripts, Campaigns, Results)")
        print("="*80)
        
        # Scripts (5 template scripts)
        script_ids = run_script_seeder(self.db, self.tenant_id)
        self.seed_data.script_ids = script_ids
        
        # Get first script for campaigns
        from app.models import BulkCallScript
        first_script = self.db.query(BulkCallScript).filter(
            BulkCallScript.tenant_id == self.tenant_id
        ).first()
        
        if first_script and len(self.seed_data.customer_ids) >= 20:
            # Bulk Campaigns (3 campaigns)
            campaign_ids = run_bulk_campaign_seeder(
                self.db, self.tenant_id, count=3,
                customer_ids=self.seed_data.customer_ids[:30],
                script_id=first_script.id,
                script_content=first_script.content
            )
            self.seed_data.bulk_campaign_ids = campaign_ids
            
            # Bulk Results for each campaign
            for campaign_id in campaign_ids:
                from app.models import BulkCallCampaign
                campaign = self.db.query(BulkCallCampaign).filter(
                    BulkCallCampaign.id == campaign_id
                ).first()
                
                if campaign:
                    # Build customer data map
                    customer_data = {}
                    for cust_id in campaign.customer_ids[:20]:
                        customer = self.db.query(Customer).filter(Customer.id == cust_id).first()
                        if customer:
                            customer_data[cust_id] = {
                                'name': customer.name,
                                'phone': customer.phone
                            }
                    
                    # Seed results
                    result_ids = run_bulk_result_seeder(
                        self.db, self.tenant_id,
                        campaign_id=campaign_id,
                        customer_ids=campaign.customer_ids[:20],
                        customer_data=customer_data
                    )
                    self.seed_data.bulk_result_ids.extend(result_ids)
        
        print("\n✅ Phase 5 Complete: Bulk calling feature seeded")
    
    def _phase_6_supporting_data(self):
        """Phase 6: Supporting Data - Events, Handoffs, Approvals"""
        print("\n" + "="*80)
        print("📌 PHASE 6: Supporting Data (Events, Handoffs, Approvals)")
        print("="*80)
        
        # Legacy campaigns with metrics
        campaign_ids = run_campaign_seeder(self.db, self.tenant_id, count=3)
        self.seed_data.campaign_ids = campaign_ids
        
        # Audit trail (handoffs, approvals, events)
        run_supporting_seeder(
            self.db, self.tenant_id,
            conversation_ids=self.seed_data.conversation_ids[:5],
            ticket_ids=self.seed_data.ticket_ids[:3]
        )
        
        print("\n✅ Phase 6 Complete: Supporting data seeded")
    
    def _print_summary(self):
        """Print seeding summary"""
        print("\n" + "="*80)
        print("📊 SEEDING SUMMARY")
        print("="*80)
        
        summary = [
            ("Organizations", len(self.seed_data.organization_ids)),
            ("Users", len(self.seed_data.user_ids)),
            ("Customers", len(self.seed_data.customer_ids)),
            ("Voice Sessions", len(self.seed_data.voice_session_ids)),
            ("Conversations", len(self.seed_data.conversation_ids)),
            ("Calls", len(self.seed_data.call_ids)),
            ("Bookings", len(self.seed_data.booking_ids)),
            ("Tickets", len(self.seed_data.ticket_ids)),
            ("Scripts", len(self.seed_data.script_ids)),
            ("Bulk Campaigns", len(self.seed_data.bulk_campaign_ids)),
            ("Bulk Results", len(self.seed_data.bulk_result_ids)),
            ("Campaigns (Legacy)", len(self.seed_data.campaign_ids))
        ]
        
        total_records = sum(count for _, count in summary)
        
        for entity, count in summary:
            print(f"  {entity:.<50} {count:>5}")
        
        print("-"*80)
        print(f"  {'TOTAL RECORDS':.<50} {total_records:>5}")
        print("="*80)
        
        print("\n✅ SEEDING COMPLETED SUCCESSFULLY!")
        print(f"🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed the database with demo data')
    parser.add_argument(
        '--tenant',
        type=str,
        default='demo-tenant',
        help='Tenant ID for seeding (default: demo-tenant)'
    )
    parser.add_argument(
        '--clean',
        action='store_true',
        help='Clean database before seeding (DANGER: deletes all data)'
    )
    
    args = parser.parse_args()
    
    if args.clean:
        confirm = input("\n⚠️  WARNING: This will DELETE ALL DATA. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return
    
    orchestrator = SeedOrchestrator(tenant_id=args.tenant)
    success = orchestrator.start()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
