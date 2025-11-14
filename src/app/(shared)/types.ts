export type Neighborhood =
  | 'حي الملقا'
  | 'حي التعاون'
  | 'حي حطين'
  | 'حي الندى'
  | 'حي قرطبة'
  | 'حي القيروان'
  | 'حي النرجس';

export interface Property {
  id: string;
  code: string;            // مثال: "المجيدية - MG13"
  city: 'الرياض';
  neighborhood: Neighborhood;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  monthlyPriceSAR: number; // السعر الشهري (ر.س)
  yearlyPriceSAR: number;  // السعر السنوي (ر.س)
  images: string[];
  availability: 'متاح' | 'محجوز' | 'مشغول';
}

export type Intent =
  | 'استعلام_توافر'
  | 'استعلام_سعر'
  | 'حجز_زيارة'
  | 'انشاء_حجز'
  | 'الغاء_حجز'
  | 'تجديد'
  | 'تذكرة_صيانة'
  | 'سؤال_عام'
  | 'تأهيل_عميل'
  | 'بيع_إضافي'
  | 'تاريخ_انتقال'
  | 'ترحيب';

export interface EntityBag {
  city?: string;                 // الرياض
  neighborhood?: Neighborhood;   // حي ...
  budgetSAR?: number;            // الميزانية
  bedrooms?: number;             // غرف النوم
  moveInDate?: string;           // ISO
  contact?: { name?: string; phone?: string; email?: string };
}

export interface CallAction {
  type: 'CREATE_BOOKING' | 'RAISE_TICKET' | 'SEND_WHATSAPP' | 'SEND_EMAIL';
  payload: Record<string, any>;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  direction: 'وارد' | 'صادر';
  persona: 'دعم' | 'مبيعات';
  campaignId?: string;
  transcript: Array<{ role: 'user' | 'agent'; text: string; ts: number }>;
  detectedIntent?: Intent;
  entities?: EntityBag;
  actions: CallAction[];
  outcome: 'متصل' | 'لم_يجب' | 'مؤهل' | 'حجز' | 'تذكرة' | 'متروك';
  handleTimeSec: number;
  sentiment: 'إيجابي' | 'محايد' | 'سلبي';
  csat?: number; // 1-5
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  contact: { name: string; phone: string; email?: string };
  startDate: string;
  endDate?: string;
  status: 'معلق' | 'مؤكد' | 'ملغي' | 'مكتمل';
  source: 'مساعد_صوتي' | 'واتساب' | 'ويب' | 'زيارة';
  priceSAR: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  propertyId?: string;
  priority: 'منخفض' | 'متوسط' | 'عالٍ' | 'عاجل';
  category: 'سباكة' | 'كهرباء' | 'مفاتيح' | 'تنظيف' | 'أخرى';
  status: 'مفتوحة' | 'قيد_المعالجة' | 'بانتظار_الموافقة' | 'محلولة';
  assignee?: string;
  notes?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string; // اسم الحملة
  objective: 'حجوزات' | 'تجديدات' | 'تحصيل_عملاء' | 'بيع_إضافي';
  status: 'نشطة' | 'موقوفة' | 'مكتملة';
  budgetSAR?: number;
  costSAR: number;
  calls: number;
  qualified: number;
  bookings: number;
  revenueSAR: number;
  roas?: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'جديد' | 'مؤهل' | 'حجز' | 'ربح' | 'خسارة';
  budgetSAR?: number;
  preferredNeighborhoods?: Neighborhood[];
  preferredBedrooms?: number;
  moveInDate?: string;
  source: 'مساعد_صوتي' | 'واتساب' | 'ويب' | 'إحالة';
  campaignId?: string;
  lastCallSummary?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'عميل' | 'مستأجر' | 'مورد' | 'موظف';
  properties?: string[];
  totalBookings: number;
  totalRevenueSAR: number;
  lastInteraction: string;
  createdAt: string;
}

// New types for Agentic Navaia
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget?: number;
  neighborhoods: Neighborhood[];
  stage: 'جديد' | 'مؤهل' | 'حجز' | 'ربح' | 'خسارة';
  consents: {
    marketing: boolean;
    recording: boolean;
    whatsapp: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'صوت' | 'رسالة';
  customerId: string;
  transcript: Array<{ role: 'user' | 'agent'; text: string; ts: number }>;
  summary: string;
  entities: EntityBag;
  sentiment: 'إيجابي' | 'محايد' | 'سلبي';
  recordingUrl?: string;
  status: 'مفتوحة' | 'مغلقة' | 'محولة_للبشر';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedTicket {
  id: string;
  customerId: string;
  propertyId?: string;
  priority: 'منخفض' | 'متوسط' | 'عالٍ' | 'عاجل';
  category: 'سباكة' | 'كهرباء' | 'مفاتيح' | 'تنظيف' | 'أخرى';
  assignee?: string;
  status: 'مفتوحة' | 'قيد_المعالجة' | 'بانتظار_الموافقة' | 'محلولة';
  slaDueAt: string;
  resolutionNote?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedBooking {
  id: string;
  customerId: string;
  propertyId: string;
  startDate: string;
  endDate?: string;
  status: 'معلق' | 'مؤكد' | 'ملغي' | 'مكتمل';
  price: number;
  source: 'صوت' | 'رسالة';
  createdBy: 'AI' | 'بشري';
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedCampaign {
  id: string;
  name: string;
  type: 'صوتية' | 'رسائل';
  objective: 'حجوزات' | 'تجديدات' | 'ترويج';
  audienceQuery: string;
  status: 'نشطة' | 'موقوفة' | 'مكتملة';
  scheduledAt?: string;
  metrics: {
    reached: number;
    engaged: number;
    qualified: number;
    booked: number;
    revenue: number;
    roas: number;
  };
  attribution: 'AI' | 'بشري';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIs {
  totalCalls: number;
  answerRate: number;
  conversionToBooking: number;
  revenue: number;
  roas: number;
  avgHandleTime: number;
  csat: number;
  missedCalls: number;
  aiTransferred: number;
  systemStatus: 'AI_يعمل' | 'التحويل_للبشر';
  totalCallsChange?: number;
  answerRateChange?: number;
  conversionChange?: number;
  revenueChange?: number;
  reachedCount?: number;
  interactedCount?: number;
  qualifiedCount?: number;
  bookedCount?: number;
  reachedPercentage?: number;
  interactedPercentage?: number;
  qualifiedPercentage?: number;
  bookedPercentage?: number;
}

export interface LiveOps {
  currentCalls: Array<{
    id: string;
    customerName: string;
    duration: string;
    status: 'وارد' | 'فائت';
  }>;
  aiTransferredChats: Array<{
    id: string;
    customerName: string;
    reason: string;
    waitingTime: string;
  }>;
} 