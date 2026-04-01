# 🏗️ Seeding System Architecture

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SEED ORCHESTRATOR (__main__.py)                     │
│                                                                         │
│  Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6             │
│  (Foundation) → (Customers) → (Voice) → (Business) → (Bulk) → (Support)│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────┐  ┌───────────────┐  ┌──────────────┐
        │  Base Seeder  │  │  Arabic Data  │  │  Validation  │
        │               │  │               │  │              │
        │ - ID Gen      │  │ - Names       │  │ - Counts     │
        │ - Phone Gen   │  │ - Phones      │  │ - FKs        │
        │ - Email Gen   │  │ - Places      │  │ - Enums      │
        │ - Date Gen    │  │ - Intents     │  │ - Quality    │
        └───────────────┘  └───────────────┘  └──────────────┘
```

## Entity Relationship Diagram (Complete)

```
┌──────────────────┐
│  ORGANIZATIONS   │
│ ──────────────── │
│ • id (PK)        │
│ • name           │
│ • tenant_id (UK) │
│ • created_at     │
└────────┬─────────┘
         │ 1:1
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│      USERS       │         │    CUSTOMERS     │
│ ──────────────── │         │ ──────────────── │
│ • id (PK)        │         │ • id (PK)        │
│ • email (UK)     │         │ • name           │
│ • password_hash  │         │ • phone          │
│ • name           │         │ • email          │
│ • role (ENUM)    │         │ • neighborhoods  │
│ • tenant_id      │         │ • consent        │
└────────┬─────────┘         └────────┬─────────┘
         │                            │ 1:N
         │                            │
         │                   ┌────────┴────────┐
         │                   │                 │
         │                   ▼                 ▼
         │         ┌──────────────────┐ ┌──────────────────┐
         │         │  VOICE_SESSIONS  │ │  CONVERSATIONS   │
         │         │ ──────────────── │ │ ──────────────── │
         │         │ • id (PK)        │ │ • id (PK)        │
         │         │ • customer_id FK │ │ • customer_id FK │
         │         │ • status (ENUM)  │ │ • channel (ENUM) │
         │         │ • agent_id       │ │ • sentiment      │
         │         │ • intent         │ │ • recording_url  │
         │         │ • summary (AR)   │ │ • summary        │
         │         └────────┬─────────┘ └────────┬─────────┘
         │                  │ 1:N                │ 1:N
         │                  │                    │
         │         ┌────────┴─────────┐          │
         │         │                  │          │
         │         ▼                  ▼          ▼
         │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │  │    CALLS     │  │   BOOKINGS   │  │    TICKETS   │
         │  │ ──────────── │  │ ──────────── │  │ ──────────── │
         │  │ • conv_id FK │  │ • cust_id FK │  │ • cust_id FK │
         │  │ • direction  │  │ • session FK │  │ • session FK │
         │  │ • status     │  │ • project    │  │ • priority   │
         │  │ • outcome    │  │ • price_sar  │  │ • category   │
         │  │ • duration   │  │ • status     │  │ • issue (AR) │
         │  └──────────────┘  └──────────────┘  └──────────────┘
         │
         │
         ▼
┌──────────────────┐
│  BULK_CALLS      │
│ ──────────────── │
│                  │
│  ┌────────────┐  │
│  │  SCRIPTS   │  │
│  │ ────────── │  │
│  │ • content  │  │
│  │ • category │  │
│  │ • variables│  │
│  └─────┬──────┘  │
│        │ 1:N     │
│        ▼         │
│  ┌────────────┐  │
│  │ CAMPAIGNS  │  │
│  │ ────────── │  │
│  │ • status   │  │
│  │ • total    │  │
│  │ • progress │  │
│  └─────┬──────┘  │
│        │ 1:N     │
│        ▼         │
│  ┌────────────┐  │
│  │  RESULTS   │  │
│  │ ────────── │  │
│  │ • status   │  │
│  │ • outcome  │  │
│  │ • duration │  │
│  └────────────┘  │
└──────────────────┘
```

## Seeding Flow (Step by Step)

```
START
  │
  ├─► PHASE 1: Foundation
  │   ├─► Create Organization (tenant root)
  │   └─► Create Users (admin + employees)
  │
  ├─► PHASE 2: Core Data
  │   └─► Create Customers (50 with Arabic data)
  │
  ├─► PHASE 3: Voice Interactions
  │   ├─► Create Voice Sessions (30 linked to customers)
  │   ├─► Create Conversations (30 linked to customers)
  │   └─► Create Calls (30 linked to conversations)
  │
  ├─► PHASE 4: Business Outcomes
  │   ├─► Create Bookings (20 from customers/sessions)
  │   └─► Create Tickets (15 from customers/sessions)
  │
  ├─► PHASE 5: Bulk Calling
  │   ├─► Create Scripts (5 templates in Arabic)
  │   ├─► Create Campaigns (3 with customer lists)
  │   └─► Create Results (60 individual call outcomes)
  │
  ├─► PHASE 6: Supporting Data
  │   ├─► Create Legacy Campaigns (3 with metrics)
  │   ├─► Create Handoffs (AI→Human transfers)
  │   ├─► Create Approvals (ticket approvals)
  │   └─► Create Events (audit trail)
  │
  └─► VALIDATION
      ├─► Check counts
      ├─► Verify relationships
      ├─► Validate enums
      └─► Print summary

END (Success!)
```

## Data Distribution Matrix

```
┌─────────────────────┬────────┬──────────────┬──────────────────┐
│      ENTITY         │ COUNT  │  ARABIC DATA │  RELATIONSHIPS   │
├─────────────────────┼────────┼──────────────┼──────────────────┤
│ Organizations       │   1    │  Name        │  Tenant root     │
│ Users               │   6    │  Names       │  → Organization  │
│ Customers           │  50    │  Names,      │  → Organization  │
│                     │        │  Phones,     │                  │
│                     │        │  Places      │                  │
│ Voice Sessions      │  30    │  Intents,    │  → Customer      │
│                     │        │  Summaries   │                  │
│ Conversations       │  30    │  Summaries   │  → Customer      │
│ Calls               │  30    │  Outcomes    │  → Conversation  │
│ Bookings            │  20    │  Projects,   │  → Customer,     │
│                     │        │  Prices SAR  │  → Session       │
│ Tickets             │  15    │  Categories, │  → Customer,     │
│                     │        │  Issues      │  → Session       │
│ Scripts             │   5    │  Templates   │  Standalone      │
│ Bulk Campaigns      │   3    │  Names       │  → Script,       │
│                     │        │              │  → Customers     │
│ Bulk Results        │  60    │  Outcomes    │  → Campaign,     │
│                     │        │              │  → Customer      │
│ Campaigns (Legacy)  │   3    │  Names       │  Standalone      │
│ Campaign Metrics    │  90    │  -           │  → Campaign      │
│ Handoffs            │   5    │  Reasons     │  → Conversation  │
│ Approvals           │   3    │  -           │  → Ticket        │
│ Events              │  N/A   │  -           │  Audit trail     │
└─────────────────────┴────────┴──────────────┴──────────────────┘
```

## Enum Usage Map

```
CallDirectionEnum          ──┐
  • inbound (وارد)            │
  • outbound (صادر)           │
                              │
CallStatusEnum               ├──> CALLS
  • connected (متصل)          │
  • no_answer (لم يجب)        │
  • abandoned (متروك)         │
                              │
CallOutcomeEnum              ──┘
  • qualified (مؤهل)
  • booked (محجوز)
  • ticket (تذكرة)
  • info (معلومات)

TicketPriorityEnum         ──┐
  • low (منخفض)              │
  • med (متوسط)              │
  • high (عالٍ)               │
  • urgent (عاجل)            │
                              ├──> TICKETS
TicketStatusEnum             │
  • open (مفتوحة)             │
  • in_progress (قيد المعالجة)│
  • resolved (محلولة)        │
                              │
BookingStatusEnum            ──┘
  • pending (معلق)
  • confirmed (مؤكد)
  • canceled (ملغي)
  • completed (مكتمل)

VoiceSessionStatus         ──┐
  • active (نشط)             │
  • completed (مكتمل)        │
  • failed (فشل)             │
                              ├──> VOICE SESSIONS
BulkCallStatusEnum           │
  • queued (في الانتظار)      │
  • running (جارٍ)           │
  • paused (متوقف)           │
  • completed (مكتمل)        │
  • failed (فشل)             │
  • cancelled (ملغي)         │
                              │
BulkCallResultStatusEnum     ├──> BULK CALLS
  • queued (في الانتظار)      │
  • in_progress (جارٍ)       │
  • success (نجاح)           │
  • failed (فشل)             │
  • voicemail (بريد صوتي)    │
  • no_answer (لم يجب)       │
  • busy (مشغول)             │
  • cancelled (ملغي)         │
                              │
BulkCallOutcomeEnum          ──┘
  • interested (مهتم)
  • not_interested (غير مهتم)
  • follow_up_requested (طلب متابعة)
  • appointment_booked (حجز موعد)
  • information_only (معلومات فقط)
  • wrong_number (رقم خطأ)
  • do_not_call (عدم الاتصال)
```

## Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION                      │
│                                                          │
│  tenant_id = "demo-tenant" (default)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ORGANIZATION (tenant root)                      │  │
│  │  org_abc123 │ Navaia Real Estate │ demo-tenant   │  │
│  └──────────────────────────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────┴──────────────────────────────┐  │
│  │  USERS (filtered by tenant_id)                  │  │
│  │  usr_* │ admin@navaia.com │ demo-tenant         │  │
│  │  usr_* │ employee1@navaia.com │ demo-tenant     │  │
│  └───────────────────────────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────┴──────────────────────────────┐  │
│  │  ALL ENTITIES (cascade tenant_id)               │  │
│  │  • Customers    • Calls        • Campaigns      │  │
│  │  • Sessions     • Bookings     • Scripts        │  │
│  │  • Conversations• Tickets      • Results        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Query Pattern:
  SELECT * FROM customers WHERE tenant_id = 'demo-tenant'
  SELECT * FROM bookings WHERE tenant_id = 'demo-tenant'
  ... (all entities)
```

## Validation Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                   VALIDATION SCRIPT                      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ COUNT CHECK  │  │  FK CHECK    │  │ ENUM CHECK   │
│              │  │              │  │              │
│ • Expected   │  │ • Customer→  │  │ • Priority   │
│   vs Actual  │  │   Org        │  │ • Status     │
│ • Warning if │  │ • Session→   │  │ • Direction  │
│   mismatch   │  │   Customer   │  │ • Outcome    │
│ • Error if   │  │ • Call→      │  │ • All valid? │
│   < minimum  │  │   Conversation│ │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  QUALITY CHECK   │
                │                  │
                │ • Phones not null│
                │ • Emails valid   │
                │ • Issues present │
                │ • Scripts present│
                └──────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │   FINAL REPORT   │
                │                  │
                │ ✅ Pass          │
                │ ❌ Errors        │
                │ ⚠️  Warnings      │
                └──────────────────┘
```

## Command Line Interface

```
python -m scripts.seeds [OPTIONS]

Options:
  --tenant TEXT    Tenant ID (default: demo-tenant)
  --clean          Clean database before seeding
  --help           Show help message

Examples:
  # Standard seeding
  python -m scripts.seeds

  # Clean and reseed
  python -m scripts.seeds --clean

  # Custom tenant
  python -m scripts.seeds --tenant my-company

  # Validate only
  python -m scripts.seeds.validate_seeds
```

## File Dependencies

```
__main__.py (Orchestrator)
  │
  ├─> base_seeder.py
  │     └─> app.db
  │
  ├─> seed_organizations.py
  │     └─> base_seeder.py
  │
  ├─> seed_users.py
  │     └─> base_seeder.py
  │     └─> app.password_utils
  │
  ├─> seed_customers.py
  │     └─> base_seeder.py
  │
  ├─> seed_voice_sessions.py
  │     └─> base_seeder.py
  │
  ├─> seed_conversations.py
  │     └─> base_seeder.py
  │
  ├─> seed_calls.py
  │     └─> base_seeder.py
  │
  ├─> seed_bookings.py
  │     └─> base_seeder.py
  │
  ├─> seed_tickets.py
  │     └─> base_seeder.py
  │
  ├─> seed_scripts.py
  │     └─> base_seeder.py
  │
  ├─> seed_bulk_campaigns.py
  │     └─> base_seeder.py
  │
  ├─> seed_bulk_results.py
  │     └─> base_seeder.py
  │
  ├─> seed_campaigns.py
  │     └─> base_seeder.py
  │
  └─> seed_supporting.py
        └─> base_seeder.py

validate_seeds.py
  └─> app.models
  └─> app.db
```

---

This architecture ensures:
✅ **Data Integrity** (proper FK relationships)
✅ **Consistency** (all enums respected)
✅ **Scalability** (multi-tenant ready)
✅ **Maintainability** (modular seeders)
✅ **Testability** (validation included)
✅ **Usability** (one-command execution)
