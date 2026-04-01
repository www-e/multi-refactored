# 🚀 Quick Reference - Database Seeding

## One-Line Commands

```bash
# Full seed (recommended)
cd backend && python -m scripts.seeds

# Clean and reseed
cd backend && python -m scripts.seeds --clean

# Validate seeded data
cd backend && python -m scripts.seeds.validate_seeds

# Custom tenant
cd backend && python -m scripts.seeds --tenant my-tenant
```

## Default Credentials

```
Admin Email: admin@navaia.com
Admin Password: Admin123!Admin123!
Tenant ID: demo-tenant
```

## Data Counts

| Entity | Count | Arabic Data |
|--------|-------|-------------|
| Users | 6 | ✓ Names |
| Customers | 50 | ✓ Names, Phones, Neighborhoods |
| Voice Sessions | 30 | ✓ Intents, Summaries |
| Calls | 30 | ✓ Statuses, Outcomes |
| Bookings | 20 | ✓ Projects, Prices (SAR) |
| Tickets | 15 | ✓ Categories, Issues (Arabic) |
| Scripts | 5 | ✓ Templates (Arabic) |
| Bulk Campaigns | 3 | ✓ Names (Arabic) |

## Entity Relationship Map

```
User ──┐
       ├─> Organization (tenant)
Customer ──┘
    │
    ├──> VoiceSession ──> BulkCallCampaign ──> BulkCallResult
    │
    ├──> Conversation ──> Call
    │
    ├──> Booking
    │
    └──> Ticket
```

## Enum Values Quick Reference

### Call Direction
- `inbound` (وارد)
- `outbound` (صادر)

### Call Status
- `connected` (متصل)
- `no_answer` (لم يجب)
- `abandoned` (متروك)

### Ticket Priority
- `low` (منخفض)
- `med` (متوسط)
- `high` (عالٍ)
- `urgent` (عاجل)

### Booking Status
- `pending` (معلق)
- `confirmed` (مؤكد)
- `canceled` (ملغي)
- `completed` (مكتمل)

## Common Tasks

### Seed Only Customers
```python
from scripts.seeds import run_customer_seeder
customer_ids = run_customer_seeder(db, "demo-tenant", count=50)
```

### Seed Only Users
```python
from scripts.seeds import run_user_seeder
user_ids = run_user_seeder(db, "demo-tenant", user_count=5)
```

### Check Data
```python
from app.models import Customer
count = db.query(Customer).filter(Customer.tenant_id == "demo-tenant").count()
print(f"Customers: {count}")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import errors | Run from `backend/` directory |
| Foreign key errors | Use orchestrator, not individual seeders |
| Duplicate errors | Use `--clean` flag |
| No data showing | Check tenant ID matches |

## File Locations

```
backend/scripts/seeds/
├── __main__.py              # Main orchestrator
├── base_seeder.py           # Utilities & Arabic data
├── seed_*.py                # Individual seeders
├── validate_seeds.py        # Validation script
└── README.md                # Full documentation
```

## Next Steps After Seeding

1. **Start Backend**: `cd backend && uvicorn app.main:app --reload`
2. **Start Frontend**: `npm run dev`
3. **Login**: Use admin credentials above
4. **View Data**: Navigate to Dashboard, Customers, Calls, etc.
