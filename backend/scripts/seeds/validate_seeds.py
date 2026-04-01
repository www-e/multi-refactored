"""
Seed Data Validation Script
Validates seeded data for consistency and integrity
"""
import sys
import os
from typing import Dict, List, Tuple

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import SessionLocal
from app.models import (
    Organization, User, Customer, VoiceSession, Conversation,
    Call, Booking, Ticket, BulkCallScript, BulkCallCampaign,
    BulkCallResult, Campaign, CampaignMetrics, Event, Handoff, Approval
)


class SeedValidator:
    """Validates seeded data for consistency and integrity"""
    
    def __init__(self, tenant_id: str = "demo-tenant"):
        self.tenant_id = tenant_id
        self.db = SessionLocal()
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict[str, int] = {}
    
    def validate_all(self) -> bool:
        """Run all validations"""
        print("\n" + "="*80)
        print("🔍 VALIDATING SEEDED DATA")
        print("="*80)
        print(f"Tenant: {self.tenant_id}\n")
        
        self._validate_counts()
        self._validate_relationships()
        self._validate_enums()
        self._validate_data_quality()
        
        self._print_report()
        
        return len(self.errors) == 0
    
    def _validate_counts(self):
        """Validate record counts"""
        print("📊 Validating record counts...")
        
        expected = {
            'organizations': 1,
            'users': 6,
            'customers': 50,
            'voice_sessions': 30,
            'conversations': 30,
            'calls': 30,
            'bookings': 20,
            'tickets': 15,
            'bulk_call_scripts': 5,
            'bulk_call_campaigns': 3,
            'campaigns': 3
        }
        
        models = {
            'organizations': Organization,
            'users': User,
            'customers': Customer,
            'voice_sessions': VoiceSession,
            'conversations': Conversation,
            'calls': Call,
            'bookings': Booking,
            'tickets': Ticket,
            'bulk_call_scripts': BulkCallScript,
            'bulk_call_campaigns': BulkCallCampaign,
            'campaigns': Campaign
        }
        
        for name, expected_count in expected.items():
            model = models[name]
            count = self.db.query(model).filter(
                model.tenant_id == self.tenant_id
            ).count()
            
            self.stats[f'{name}_count'] = count
            
            if count < expected_count:
                self.errors.append(f"{name}: Expected {expected_count}, found {count}")
            elif count > expected_count:
                self.warnings.append(f"{name}: Expected {expected_count}, found {count} (may be from previous seeding)")
            else:
                print(f"  ✅ {name}: {count}")
        
        print()
    
    def _validate_relationships(self):
        """Validate foreign key relationships"""
        print("🔗 Validating relationships...")
        
        # Validate all conversations have customers
        conv_without_cust = self.db.query(Conversation).join(
            Customer, Conversation.customer_id == Customer.id, isouter=True
        ).filter(
            Conversation.tenant_id == self.tenant_id,
            Customer.id == None
        ).count()
        
        if conv_without_cust > 0:
            self.errors.append(f"{conv_without_cust} conversations without customers")
        else:
            print("  ✅ All conversations have customers")
        
        # Validate all calls have conversations
        calls_without_conv = self.db.query(Call).join(
            Conversation, Call.conversation_id == Conversation.id, isouter=True
        ).filter(
            Call.tenant_id == self.tenant_id,
            Conversation.id == None
        ).count()
        
        if calls_without_conv > 0:
            self.errors.append(f"{calls_without_conv} calls without conversations")
        else:
            print("  ✅ All calls have conversations")
        
        # Validate all bookings have customers
        bookings_without_cust = self.db.query(Booking).join(
            Customer, Booking.customer_id == Customer.id, isouter=True
        ).filter(
            Booking.tenant_id == self.tenant_id,
            Customer.id == None
        ).count()
        
        if bookings_without_cust > 0:
            self.errors.append(f"{bookings_without_cust} bookings without customers")
        else:
            print("  ✅ All bookings have customers")
        
        # Validate all tickets have customers
        tickets_without_cust = self.db.query(Ticket).join(
            Customer, Ticket.customer_id == Customer.id, isouter=True
        ).filter(
            Ticket.tenant_id == self.tenant_id,
            Customer.id == None
        ).count()
        
        if tickets_without_cust > 0:
            self.errors.append(f"{tickets_without_cust} tickets without customers")
        else:
            print("  ✅ All tickets have customers")
        
        print()
    
    def _validate_enums(self):
        """Validate enum values"""
        print("📋 Validating enum values...")
        
        # Validate ticket priorities
        valid_priorities = ['low', 'med', 'high', 'urgent']
        invalid_priorities = self.db.query(Ticket).filter(
            Ticket.tenant_id == self.tenant_id,
            ~Ticket.priority.in_(valid_priorities)
        ).count()
        
        if invalid_priorities > 0:
            self.errors.append(f"{invalid_priorities} tickets with invalid priority")
        else:
            print("  ✅ All ticket priorities valid")
        
        # Validate booking statuses
        valid_statuses = ['pending', 'confirmed', 'canceled', 'completed']
        invalid_statuses = self.db.query(Booking).filter(
            Booking.tenant_id == self.tenant_id,
            ~Booking.status.in_(valid_statuses)
        ).count()
        
        if invalid_statuses > 0:
            self.errors.append(f"{invalid_statuses} bookings with invalid status")
        else:
            print("  ✅ All booking statuses valid")
        
        # Validate call directions
        valid_directions = ['inbound', 'outbound']
        invalid_directions = self.db.query(Call).filter(
            Call.tenant_id == self.tenant_id,
            ~Call.direction.in_(valid_directions)
        ).count()
        
        if invalid_directions > 0:
            self.errors.append(f"{invalid_directions} calls with invalid direction")
        else:
            print("  ✅ All call directions valid")
        
        print()
    
    def _validate_data_quality(self):
        """Validate data quality"""
        print("✨ Validating data quality...")
        
        # Check for customers without phones
        customers_no_phone = self.db.query(Customer).filter(
            Customer.tenant_id == self.tenant_id,
            (Customer.phone == None) | (Customer.phone == '')
        ).count()
        
        if customers_no_phone > 0:
            self.errors.append(f"{customers_no_phone} customers without phone numbers")
        else:
            print("  ✅ All customers have phone numbers")
        
        # Check for users without emails
        users_no_email = self.db.query(User).filter(
            User.tenant_id == self.tenant_id,
            (User.email == None) | (User.email == '')
        ).count()
        
        if users_no_email > 0:
            self.errors.append(f"{users_no_email} users without emails")
        else:
            print("  ✅ All users have emails")
        
        # Check for tickets without issues
        tickets_no_issue = self.db.query(Ticket).filter(
            Ticket.tenant_id == self.tenant_id,
            (Ticket.issue == None) | (Ticket.issue == '')
        ).count()
        
        if tickets_no_issue > 0:
            self.warnings.append(f"{tickets_no_issue} tickets without issue descriptions")
        else:
            print("  ✅ All tickets have issue descriptions")
        
        # Check for bulk campaigns without scripts
        campaigns_no_script = self.db.query(BulkCallCampaign).filter(
            BulkCallCampaign.tenant_id == self.tenant_id,
            (BulkCallCampaign.script_content == None) | (BulkCallCampaign.script_content == '')
        ).count()
        
        if campaigns_no_script > 0:
            self.errors.append(f"{campaigns_no_script} bulk campaigns without script content")
        else:
            print("  ✅ All bulk campaigns have script content")
        
        print()
    
    def _print_report(self):
        """Print validation report"""
        print("="*80)
        print("📊 VALIDATION REPORT")
        print("="*80)
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")
        else:
            print("\n✅ No errors found!")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        print("\n" + "="*80)
        
        if self.errors:
            print("❌ VALIDATION FAILED")
        else:
            print("✅ VALIDATION PASSED")
        
        print("="*80 + "\n")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate seeded data')
    parser.add_argument(
        '--tenant',
        type=str,
        default='demo-tenant',
        help='Tenant ID to validate (default: demo-tenant)'
    )
    
    args = parser.parse_args()
    
    validator = SeedValidator(tenant_id=args.tenant)
    success = validator.validate_all()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
