# 🌱 Agentic Navaia - Database Seeding System

Complete database seeding system for the Agentic Navaia Voice Agent Portal with realistic Arabic data, proper entity relationships, and multi-tenant support.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Seeders Directory](#seeders-directory)
- [Data Models](#data-models)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The seeding system creates realistic demo data for:

- **15 database tables** with proper foreign key relationships
- **Multi-tenant isolation** (default: `demo-tenant`)
- **Arabic locale support** (Saudi names, neighborhoods, phone numbers)
- **Enum consistency** (all status/priority/outcome enums)
- **Realistic data distribution** (80% positive sentiment, 75% inbound calls, etc.)

### What Gets Seeded

| Entity | Count | Description |
|--------|-------|-------------|
| Organizations | 1 | Tenant organization |
| Users | 6 | 1 admin + 5 regular users |
| Customers | 50 | Arabic names, Saudi phones |
| Voice Sessions | 30 | ElevenLabs AI sessions |
| Conversations | 30 | Call interactions |
| Calls | 30 | Telephony records |
| Bookings | 20 | Property appointments |
| Tickets | 15 | Support cases |
| Scripts | 5 | Bulk call templates |
| Bulk Campaigns | 3 | Outbound campaigns |
| Bulk Results | 60 | Individual call results |
| Campaigns | 3 | Legacy campaigns with metrics |

## 🏗️ Architecture

### Directory Structure

```
backend/scripts/seeds/
├── __init__.py              # Package exports
├── __main__.py              # Master orchestrator
├── base_seeder.py           # Base utilities & Arabic data
├── seed_organizations.py    # Organizations & tenants
├── seed_users.py            # Authentication users
├── seed_customers.py        # End customers
├── seed_voice_sessions.py   # ElevenLabs sessions
├── seed_conversations.py    # Conversation records
├── seed_calls.py            # Call records
├── seed_bookings.py         # Property bookings
├── seed_tickets.py          # Support tickets
├── seed_scripts.py          # Call scripts
├── seed_bulk_campaigns.py   # Bulk campaigns
├── seed_bulk_results.py     # Bulk call results
├── seed_campaigns.py        # Legacy campaigns
└── seed_supporting.py       # Events, handoffs, approvals
```

### Seeding Order (Dependency Graph)

```
1. Organizations ─┬─> 2. Users
                  │
                  └─> 3. Customers ─> 4. Voice Sessions
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
              5. Conversations    6. Calls            7. Bookings
                    │                                      │
                    │                                      │
                    ▼                                      ▼
              8. Tickets                           9. Bulk Campaigns
                                                        │
                                                        ▼
                                                 10. Bulk Results
                                                        │
                                                        ▼
                                                 11. Supporting Data
```

## 🚀 Quick Start

### Option 1: Run All Seeders (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run complete seeding
python -m scripts.seeds

# Or with custom tenant
python -m scripts.seeds --tenant my-tenant

# Clean database first (DANGER: deletes all data!)
python -m scripts.seeds --clean
```

### Option 2: Individual Seeders

```python
from app.db import SessionLocal
from scripts.seeds import run_customer_seeder, run_user_seeder

db = SessionLocal()

# Seed only customers
customer_ids = run_customer_seeder(db, tenant_id="demo-tenant", count=50)

# Seed only users
user_ids = run_user_seeder(db, tenant_id="demo-tenant", user_count=5)

db.close()
```

### Option 3: Programmatic Usage

```python
from scripts.seeds import SeedOrchestrator

orchestrator = SeedOrchestrator(tenant_id="demo-tenant")
success = orchestrator.start()

if success:
    print("✅ Seeding completed!")
```

## 📚 Seeders Directory

### Base Seeder (`base_seeder.py`)

Common utilities for all seeders:

- **ID Generation**: `generate_id("prefix")` → `"prefix_abc123"`
- **Phone Generation**: `generate_phone()` → `"+966512345678"`
- **Email Generation**: `generate_email("محمد أحمد")` → `"mohamed.ahmed@gmail.com"`
- **Date Generation**: `random_date(start, end)`
- **Arabic Data**: Names, neighborhoods, projects, intents

### Organization Seeder

Creates tenant organizations for multi-tenant isolation.

```python
from scripts.seeds import run_organization_seeder

org_ids = run_organization_seeder(db, "demo-tenant")
```

### User Seeder

Creates admin and regular users with hashed passwords.

```python
from scripts.seeds import run_user_seeder

# Default: 1 admin + 5 users
user_ids = run_user_seeder(db, "demo-tenant")

# Custom counts
user_ids = run_user_seeder(db, "demo-tenant", user_count=10, admin_count=2)
```

**Default Admin Credentials:**
- Email: `admin@navaia.com`
- Password: `Admin123!Admin123!`

### Customer Seeder

Creates customers with realistic Arabic names and Saudi phone numbers.

```python
from scripts.seeds import run_customer_seeder

customer_ids = run_customer_seeder(db, "demo-tenant", count=50)
```

**Data includes:**
- Arabic names (محمد أحمد, فاطمة علي, etc.)
- Saudi phone numbers (+9665XXXXXXXX)
- Email addresses
- Neighborhood preferences (حي الملقا, حي حطين, etc.)
- Marketing consent flags (75% true)

### Voice Session Seeder

Creates ElevenLabs AI voice sessions.

```python
from scripts.seeds import run_voice_session_seeder

# With customer data
customer_data = [{'customer_id': 'cust_123', 'phone': '+966512345678'}]
session_ids = run_voice_session_seeder(db, "demo-tenant", count=30, customer_data=customer_data)
```

**Status Distribution:**
- 80% Completed
- 10% Active
- 10% Failed

### Conversation Seeder

Creates conversation records linked to customers.

```python
from scripts.seeds import run_conversation_seeder

conversation_ids = run_conversation_seeder(db, "demo-tenant", count=30, customer_ids=customer_ids)
```

**Sentiment Distribution:**
- 60% Positive
- 30% Neutral
- 10% Negative

### Call Seeder

Creates telephony call records.

```python
from scripts.seeds import run_call_seeder

call_ids = run_call_seeder(db, "demo-tenant", count=30, conversation_ids=conversation_ids)
```

**Status Distribution:**
- 85% Connected
- 10% No Answer
- 5% Abandoned

### Booking Seeder

Creates property booking records.

```python
from scripts.seeds import run_booking_seeder

booking_ids = run_booking_seeder(
    db, "demo-tenant", count=20,
    customer_ids=customer_ids,
    session_ids=session_ids
)
```

**Status Distribution:**
- 30% Pending
- 30% Confirmed
- 30% Completed
- 10% Canceled

### Ticket Seeder

Creates support ticket records.

```python
from scripts.seeds import run_ticket_seeder

ticket_ids = run_ticket_seeder(
    db, "demo-tenant", count=15,
    customer_ids=customer_ids,
    session_ids=session_ids
)
```

**Priority Distribution:**
- 40% Low
- 35% Medium
- 20% High
- 5% Urgent

### Script Seeder

Creates bulk call script templates.

```python
from scripts.seeds import run_script_seeder

script_ids = run_script_seeder(db, "demo-tenant")
```

**Includes 5 templates:**
1. Marketing script (تسويق)
2. Support script (دعم فني)
3. Renewal script (تجديد عقود)
4. General script (عام)
5. Advanced sales script (مبيعات متقدم)

### Bulk Campaign Seeder

Creates outbound calling campaigns.

```python
from scripts.seeds import run_bulk_campaign_seeder

campaign_ids = run_bulk_campaign_seeder(
    db, "demo-tenant", count=3,
    customer_ids=customer_ids,
    script_id=script_id,
    script_content=script_content
)
```

**Status Types:**
- Queued, Running, Paused, Completed, Failed, Cancelled

### Bulk Result Seeder

Creates individual call results for campaigns.

```python
from scripts.seeds import run_bulk_result_seeder

result_ids = run_bulk_result_seeder(
    db, "demo-tenant",
    campaign_id=campaign_id,
    customer_ids=customer_ids,
    customer_data=customer_data
)
```

**Outcome Distribution:**
- 50% Success
- 15% Failed
- 20% No Answer
- 10% Voicemail
- 5% Busy

### Campaign Seeder (Legacy)

Creates legacy campaigns with metrics.

```python
from scripts.seeds import run_campaign_seeder

campaign_ids = run_campaign_seeder(db, "demo-tenant", count=3)
```

### Supporting Data Seeder

Creates audit trail (events, handoffs, approvals).

```python
from scripts.seeds import run_supporting_seeder

run_supporting_seeder(
    db, "demo-tenant",
    conversation_ids=conversation_ids,
    ticket_ids=ticket_ids
)
```

## 🎯 Data Models

### Entity Relationships

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐     ┌─────────────────┐
│     users       │     │    customers    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │ 1:N
         │                       ▼
         │              ┌─────────────────┐
         │              │  conversations  │
         │              └────────┬────────┘
         │                       │
         │         ┌─────────────┼─────────────┐
         │         │             │             │
         │         ▼             ▼             ▼
         │  ┌─────────────┐ ┌─────────┐ ┌──────────┐
         └─▶│voice_sessions│ │  calls  │ │ handoffs │
            └──────┬──────┘ └─────────┘ └──────────┘
                   │
                   │ 1:N
                   ▼
            ┌─────────────────┐
            │    bookings     │◀──────┐
            └─────────────────┘       │
                                      │
            ┌─────────────────┐       │
            │     tickets     │◀──────┘
            └─────────────────┘

┌─────────────────────┐
│  bulk_call_scripts  │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ bulk_call_campaigns │────▶│  bulk_call_results  │
└─────────────────────┘     └─────────────────────┘
```

### Enum Types

All seeders respect the enum types defined in `models.py`:

```python
# Call Direction
CallDirectionEnum.inbound    # وارد
CallDirectionEnum.outbound   # صادر

# Call Status
CallStatusEnum.connected     # متصل
CallStatusEnum.no_answer     # لم يجب
CallStatusEnum.abandoned     # متروك

# Call Outcome
CallOutcomeEnum.qualified    # مؤهل
CallOutcomeEnum.booked       # محجوز
CallOutcomeEnum.ticket       # تذكرة
CallOutcomeEnum.info         # معلومات

# Ticket Priority
TicketPriorityEnum.low       # منخفض
TicketPriorityEnum.med       # متوسط
TicketPriorityEnum.high      # عالٍ
TicketPriorityEnum.urgent    # عاجل

# Booking Status
BookingStatusEnum.pending    # معلق
BookingStatusEnum.confirmed  # مؤكد
BookingStatusEnum.canceled   # ملغي
BookingStatusEnum.completed  # مكتمل

# Voice Session Status
VoiceSessionStatus.ACTIVE    # نشط
VoiceSessionStatus.COMPLETED # مكتمل
VoiceSessionStatus.FAILED    # فشل
```

## ⚙️ Configuration

### Environment Variables

```bash
# Database connection
DB_URL=postgresql://user:pass@host:5432/dbname
# Or for development:
DB_URL=sqlite:///dev.db

# Tenant configuration
TENANT_ID=demo-tenant

# Admin user (optional overrides)
ADMIN_EMAIL=admin@navaia.com
ADMIN_PASSWORD=Admin123!Admin123!
ADMIN_NAME=Administrator
```

### Customizing Data

Edit `base_seeder.py` to customize:

```python
# Add more Arabic names
ARABIC_NAMES = [
    # ... existing names
    "اسم جديد"
]

# Add more neighborhoods
NEIGHBORHOODS = [
    # ... existing
    "حي جديد"
]

# Customize intents
INTENTS = [
    # ... existing
    "نية جديدة"
]
```

## 🔧 Troubleshooting

### Common Issues

**1. Foreign Key Errors**

```
sqlalchemy.exc.IntegrityError: FOREIGN KEY constraint failed
```

**Solution:** Ensure proper seeding order. Use the orchestrator (`__main__.py`) which handles dependencies.

**2. Duplicate Key Errors**

```
sqlalchemy.exc.IntegrityError: UNIQUE constraint failed: users.email
```

**Solution:** Seeders check for existing records. Use `--clean` flag to start fresh.

**3. No Data Appearing**

**Solution:** Check tenant ID consistency. All queries filter by `tenant_id`.

**4. Import Errors**

```
ModuleNotFoundError: No module named 'scripts.seeds'
```

**Solution:** Run from backend directory:
```bash
cd backend
python -m scripts.seeds
```

### Reset Database

```bash
# SQLite (development)
rm dev.db

# PostgreSQL (production - DANGER!)
docker exec -it postgres psql -U navaia -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then re-seed
python -m scripts.seeds --clean
```

## 📊 Data Validation

After seeding, verify data:

```python
from app.db import SessionLocal
from app.models import Customer, Call, Booking

db = SessionLocal()

# Count records
print(f"Customers: {db.query(Customer).filter(Customer.tenant_id == 'demo-tenant').count()}")
print(f"Calls: {db.query(Call).filter(Call.tenant_id == 'demo-tenant').count()}")
print(f"Bookings: {db.query(Booking).filter(Booking.tenant_id == 'demo-tenant').count()}")

db.close()
```

## 🎓 Best Practices

1. **Always use the orchestrator** for complete seeding to maintain referential integrity
2. **Test with small datasets** first (count=5) before seeding full data
3. **Backup production databases** before seeding
4. **Use consistent tenant IDs** across all seeders
5. **Review generated data** for accuracy before using in demos

## 📝 License

Part of the Agentic Navaia Voice Agent Portal project.
