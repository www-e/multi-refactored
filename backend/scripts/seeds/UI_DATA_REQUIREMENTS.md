# 🎯 UI Data Requirements Analysis

## Critical Findings from UI & API Analysis

### 1. Customers Page (`/customers`)

**UI Expects:**
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  neighborhoods: string[];  // ✅ Array of neighborhoods
  stage: 'جديد' | 'مؤهل' | 'حجز' | 'ربح' | 'خسارة';
  consents: {
    marketing: boolean;
    recording: boolean;
    whatsapp: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Display Requirements:**
- ✅ Name (Arabic)
- ✅ Phone (Saudi format)
- ✅ Email (optional)
- ✅ Neighborhoods (array, display first one)
- ✅ Stage badge (status)
- ✅ Stats: calls count, tickets count, bookings count

**Status Mapping:**
```typescript
stage: 'جديد' (new) | 'مؤهل' (qualified) | 'حجز' (booked) | 'ربح' (won) | 'خسارة' (lost)
```

---

### 2. Bookings Page (`/bookings`)

**API Returns (camelCase):**
```json
{
  "id": "bk_abc123",
  "customerId": "cust_xyz",
  "customerName": "محمد أحمد",
  "phone": "+966512345678",
  "project": "مشروع النخيل - حي الملقا",
  "appointmentDate": "2026-04-15T00:00:00Z",
  "appointmentTime": "14:30",
  "dayName": "الأربعاء",
  "status": "pending" | "confirmed" | "canceled" | "completed",
  "price": 75000,
  "source": "voice",
  "createdBy": "AI" | "Human",
  "createdAt": "2026-04-01T10:00:00Z",
  "propertyId": "PROP-1234"
}
```

**Display Requirements:**
- ✅ Customer name (from snapshot or lookup)
- ✅ Property/Project display
- ✅ Appointment date (formatted)
- ✅ Price (SAR format)
- ✅ Source badge (voice = 'صوت')
- ✅ Status badge (Arabic mapping)

**Status Mapping (Arabic):**
```typescript
'pending' → 'معلق'
'confirmed' → 'مؤكد'
'canceled' → 'ملغي'
'completed' → 'مكتمل'
```

---

### 3. Tickets Page (`/tickets`)

**UI Expects:**
```typescript
interface Ticket {
  id: string;
  customerId: string;
  customerName?: string;  // Snapshot from AI (priority)
  phone?: string;
  project?: string;
  priority: 'low' | 'med' | 'high' | 'urgent';
  category: string;
  issue: string;
  assignee?: string;
  status: 'open' | 'in_progress' | 'resolved';
  slaDueAt?: string;
  resolutionNote?: string;
  approvedBy?: string;
  createdAt: string;
}
```

**Display Requirements:**
- ✅ Customer name (snapshot from AI, fallback to lookup)
- ✅ Issue description (Arabic, line-clamp 2)
- ✅ Category
- ✅ Priority badge (Arabic mapping)
- ✅ Status badge (Arabic mapping)
- ✅ Project (optional)

**Priority Mapping:**
```typescript
'low' → 'منخفض'
'med' → 'متوسط'
'high' → 'عالٍ'
'urgent' → 'عاجل'
```

**Status Mapping:**
```typescript
'open' → 'مفتوحة'
'in_progress' → 'قيد المعالجة'
'resolved' → 'محلولة'
```

---

### 4. Calls Page (`/calls`)

**UI Expects:**
```typescript
interface Call {
  id: string;
  conversationId: string;
  customerId: string;
  customerName?: string;
  direction: 'وارد' | 'صادر';
  status: string;
  outcome?: string;
  handleSec?: number;
  aiOrHuman?: string;
  recordingUrl?: string;
  createdAt: string;
  voiceSessionId?: string;
  extractedIntent?: string;
  sessionSummary?: string;
  agentName?: string;
  sessionStatus?: 'active' | 'completed' | 'failed';
}
```

**Display Requirements:**
- ✅ Customer name (from snapshot or lookup)
- ✅ Direction badge (وارد = inbound, صادر = outbound)
- ✅ Status badge (Arabic mapping)
- ✅ Outcome badge (if available)
- ✅ Recording player (if URL available)
- ✅ Transcript button (if conversationId exists)
- ✅ Voice session details (if available)

**Status Mapping:**
```typescript
'connected' → 'متصل'
'no_answer' → 'لم يجب'
'abandoned' → 'متروك'
```

**Outcome Mapping:**
```typescript
'booked' → 'تم الحجز'
'ticket' → 'تم رفع تذكرة'
'qualified' → 'عميل مؤهل'
'info' → 'استفسار معلوماتي'
```

**Intent Mapping:**
```typescript
'raise_ticket' → 'رفع تذكرة'
'book_appointment' → 'حجز موعد'
'none' → 'غير مصنفة'
```

---

### 5. Dashboard Page (`/dashboard`)

**KPIs Display:**
```typescript
interface DashboardKPIs {
  totalCalls: number;
  answerRate: number;
  conversionToBooking: number;
  revenue: number;
  roas: number;
  avgHandleTime: number;  // Displayed as MM:SS
  csat: number;  // Displayed as X/5
  qualifiedCount?: number;
  // ... change metrics
}
```

**Display Requirements:**
- ✅ Total calls count
- ✅ Answer rate percentage
- ✅ Conversion rate percentage
- ✅ Revenue (SAR format)
- ✅ ROAS (X.Xx format)
- ✅ AHT (MM:SS format)
- ✅ CSAT (X/5 format)
- ✅ Latest 4 calls (sorted by createdAt desc)

---

## 🎯 Seeder Requirements

### Critical Data Requirements for Good UI Display:

1. **Customers**:
   - Must have `neighborhoods` array (at least 1)
   - Must have realistic Arabic names
   - Must have Saudi phone numbers (+966...)
   - Should have emails (80%)
   - Should have varied stages

2. **Bookings**:
   - Must have `customerName` snapshot
   - Must have `phone` snapshot
   - Must have `project` with neighborhood
   - Must have `preferred_datetime` for appointment time
   - Must have varied statuses (pending, confirmed, completed, canceled)
   - Must have realistic prices (5000-250000 SAR)

3. **Tickets**:
   - Must have `customerName` snapshot (AI extracted)
   - Must have Arabic `issue` descriptions
   - Must have `category` in Arabic
   - Must have varied priorities and statuses
   - Should have `project`
   - Should have `resolution_note` for resolved tickets

4. **Calls**:
   - Must link to VoiceSession for full data
   - Must have `extractedIntent` from AI
   - Must have `summary` in Arabic
   - Should have `recording_url` (75%)
   - Must have varied directions and statuses
   - Must have `handle_sec` for duration

5. **Voice Sessions**:
   - Must have `extracted_intent`
   - Must have `summary` in Arabic
   - Must have `agent_name` in Arabic
   - Must have varied statuses (active, completed, failed)

---

## ✅ Seeder Fixes Applied

All seeders have been updated to ensure:
- ✅ Proper camelCase field names in API responses
- ✅ Arabic snapshots for customer names
- ✅ Proper status enum mappings
- ✅ Realistic data distributions
- ✅ Complete relationships (FKs)
- ✅ Multi-tenant isolation

---

## 🚀 Ready to Seed

The seeders are now 100% consistent with UI requirements and will display correctly!
