# دليل معمارية النظام - Voice Agent Portal

## 🎯 نظرة عامة
نظام إدارة متكامل للوكلاء الذكيين (صوتي ونصي) لخدمة العملاء والمبيعات في قطاع العقارات.

**التقنيات**: Next.js 14 + ElevenLabs AI + OpenRouter GPT-3.5 + FastAPI + PostgreSQL

---

## 🔐 1. نظام تسجيل الدخول (مطلوب)

### المطلوب للتطبيق
```typescript
// صفحة تسجيل الدخول: /login
POST /api/auth/login
Body: { username, password }
Response: {
  token: string,
  user: {
    id, username, name, company_id, company_name,
    role: 'admin' | 'sales_manager' | 'support_manager' | 'agent'
  }
}
```

### Multi-Tenancy (كل شركة لها بياناتها)
- كل مستخدم ينتمي لشركة (`company_id`)
- جميع الجداول تحتوي على `company_id`
- البيانات تُصفى حسب `company_id` في كل استعلام

```sql
-- مثال
SELECT * FROM bookings WHERE company_id = 'user_company_id';
SELECT * FROM tickets WHERE company_id = 'user_company_id';
```

### الصلاحيات
```typescript
الأدوار:
- admin: كامل الصلاحيات
- sales_manager: الحملات + الحجوزات
- support_manager: التذاكر + الدعم
- agent: المحادثات فقط
```

---

## 📱 2. الصفحات - الوضع الحالي وما المطلوب

### 📊 Dashboard (`/dashboard`)
**الوضع الحالي**: أرقام وهمية ثابتة في `src/lib/store.ts`

**المطلوب**:
```
GET /api/stats/calls?company_id={id}&period=7d
GET /api/stats/conversions?company_id={id}&period=7d
GET /api/live/operations?company_id={id}
```

---

### 🎙️ Playground (`/playground`)
**الوضع الحالي**: ✅ **يعمل فعلياً!**
- Voice Agent متصل بـ ElevenLabs
- Chat Agent متصل بـ OpenRouter (GPT-3.5)

**المطلوب للتحسين**:
```
POST /api/conversations  # حفظ المحادثات في DB
POST /api/customers/find-or-create  # ربط المحادثة بعميل
```

---

### 💬 Conversations (`/conversations`)
**الوضع الحالي**: بيانات وهمية مكتوبة في الكود

**المطلوب**:
```
GET /api/conversations?company_id={id}&type=all&limit=50
GET /api/conversations/{id}
GET /api/conversations/search?q={query}&company_id={id}
```

**Response**:
```json
{
  "conversations": [{
    "id": "conv_123",
    "type": "voice" | "chat",
    "customer_name": "أحمد",
    "duration": "2:34",
    "transcript": [...],
    "summary": "استفسار عن مشروع",
    "audio_url": "https://...",
    "created_at": "2025-11-03"
  }]
}
```

---

### 📢 Campaigns (`/campaigns`)
**الوضع الحالي**: بيانات وهمية

**المطلوب**:
```
GET /api/campaigns?company_id={id}
POST /api/campaigns
PATCH /api/campaigns/{id}/status  # تشغيل/إيقاف
```

---

### 📅 Bookings (`/bookings`)
**الوضع الحالي**: API موجود جزئياً (يجلب بيانات لكن بدون تصفية)

**المطلوب**:
```
GET /api/bookings?company_id={id}&status=pending
PATCH /api/bookings/{id}/approve
PATCH /api/bookings/{id}/reject
```

---

### 🎫 Tickets (`/tickets`)
**الوضع الحالي**: API موجود جزئياً

**المطلوب**:
```
GET /api/tickets?company_id={id}&status=open
POST /api/tickets
PATCH /api/tickets/{id}/assign
PATCH /api/tickets/{id}/resolve
```

---

### 👥 Customers (`/customers`)
**الوضع الحالي**: بيانات وهمية

**المطلوب**:
```
GET /api/customers?company_id={id}
POST /api/customers
PATCH /api/customers/{id}
GET /api/customers/{id}/history  # محادثات + حجوزات + تذاكر
```

---

## 📦 3. البيانات الوهمية الحالية

### موقعها
```
كل البيانات في ملف واحد: src/lib/store.ts
```

### المحتوى
```typescript
seedCustomers (5 عملاء)
seedConversations (2 محادثة)
seedTickets (6 تذاكر)
seedBookings (6 حجوزات)
seedCampaigns (2 حملة)
seedProperties (5 عقارات)
initialKPIs (أرقام Dashboard الثابتة)
```

### ⚠️ المشاكل
1. البيانات تختفي عند إعادة التحميل
2. جميع المستخدمين يرون نفس البيانات
3. لا يوجد تصفية حسب الشركة
4. لا مزامنة بين المستخدمين

---

## 🗄️ 4. قاعدة البيانات المطلوبة

```sql
-- الجداول الأساسية
companies (id, name, settings)
users (id, company_id, username, password_hash, role)
customers (id, company_id, name, phone, email, stage)
conversations (id, company_id, customer_id, type, transcript, audio_url)
bookings (id, company_id, customer_id, status, price)
tickets (id, company_id, customer_id, category, priority, status)
campaigns (id, company_id, name, type, status, metrics)
```

**ملاحظة مهمة**: كل جدول يجب أن يحتوي على `company_id`

---

## 🔌 5. API Endpoints - ملخص شامل

### المصادقة
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

### الإحصائيات (Dashboard)
```
GET    /api/stats/calls?company_id={id}&period=7d
GET    /api/stats/conversions?company_id={id}&period=7d
GET    /api/live/operations?company_id={id}
```

### المحادثات
```
GET    /api/conversations?company_id={id}
POST   /api/conversations
GET    /api/conversations/{id}
```

### العملاء
```
GET    /api/customers?company_id={id}
POST   /api/customers
PATCH  /api/customers/{id}
```

### الحجوزات
```
GET    /api/bookings?company_id={id}
PATCH  /api/bookings/{id}/approve
PATCH  /api/bookings/{id}/reject
```

### التذاكر
```
GET    /api/tickets?company_id={id}
POST   /api/tickets
PATCH  /api/tickets/{id}/assign
PATCH  /api/tickets/{id}/resolve
```

### الحملات
```
GET    /api/campaigns?company_id={id}
POST   /api/campaigns
PATCH  /api/campaigns/{id}/status
```

---

## 💻 6. مثال على التطبيق (Frontend)

### جلب البيانات
```typescript
const user = getCurrentUser()

const response = await fetch(
  `/api/bookings?company_id=${user.company_id}`,
  {
    headers: { 'Authorization': `Bearer ${user.token}` }
  }
)
const data = await response.json()
setBookings(data.bookings)
```

### إنشاء سجل
```typescript
await fetch('/api/tickets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...ticketData,
    company_id: user.company_id
  })
})
```

### تحديث سجل
```typescript
await fetch(`/api/bookings/${id}/approve`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${user.token}` },
  body: JSON.stringify({
    approved_by: user.id,
    approved_at: new Date().toISOString()
  })
})
```

---

## ✅ 7. الخلاصة

### ما يعمل حالياً
- ✅ Voice Agent (ElevenLabs)
- ✅ Chat Agent (OpenRouter GPT-3.5)
- ✅ Voice Sessions API
- ✅ Bookings API (جزئياً)
- ✅ Tickets API (جزئياً)
- ✅ UI/UX كامل

### المطلوب (حسب الأولوية)

**أولوية 1 - حرجة**:
1. نظام المصادقة (Login + JWT)
2. Multi-Tenancy (company_id في كل مكان)
3. Dashboard APIs (إحصائيات + عمليات حية)
4. تصفية البيانات حسب company_id

**أولوية 2 - مهمة**:
5. Conversations API
6. Customers API
7. Campaigns API

**أولوية 3 - تحسينات**:
8. الصلاحيات (Role-based)
9. التقارير والتحليلات
10. الإشعارات

---

## 🎯 خطة التنفيذ (4 أسابيع)

**أسبوع 1**: المصادقة + Multi-Tenancy + APIs الأساسية  
**أسبوع 2**: Dashboard + Customers + Conversations  
**أسبوع 3**: إكمال Bookings + Tickets + Campaigns  
**أسبوع 4**: الصلاحيات + اختبار + تحسينات

---

**آخر تحديث**: 3 نوفمبر 2025  
**الإصدار**: 1.0
