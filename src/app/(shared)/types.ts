// File: src/app/(shared)/types.ts

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
  code: string;
  city: 'الرياض';
  neighborhood: Neighborhood;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  monthlyPriceSAR: number;
  yearlyPriceSAR: number;
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
  city?: string;
  neighborhood?: Neighborhood;
  budgetSAR?: number;
  bedrooms?: number;
  moveInDate?: string;
  contact?: { name?: string; phone?: string; email?: string };
}

export interface CallAction {
  type: 'CREATE_BOOKING' | 'RAISE_TICKET' | 'SEND_WHATSAPP' | 'SEND_EMAIL';
  payload: Record<string, any>;
  createdAt: string;
}

export interface Call {
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
  updatedAt?: string;
  // Voice Session specific fields
  voiceSessionId?: string;
  extractedIntent?: string;
  sessionSummary?: string;
  agentName?: string;
  sessionStatus?: 'active' | 'completed' | 'failed';
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
  csat?: number;
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
  name: string;
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


export interface EnhancedTicket {
  id: string;
  customerId: string;
  customerName?: string; // Added to match backend
  phone?: string;
  propertyId?: string;
  project?: string;      // Added to match backend
  priority: 'low' | 'med' | 'high' | 'urgent';
  category: string;
  issue: string;
  assignee?: string;
  status: 'open' | 'in_progress' | 'resolved';
  slaDueAt?: string;
  resolutionNote?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EnhancedBooking {
  id: string;
  customerId: string;
  customerName?: string; // Added
  phone?: string;
  propertyId: string;
  project?: string;      // Added
  startDate: string;
  endDate?: string;
  status: 'معلق' | 'مؤكد' | 'ملغي' | 'مكتمل';
  price: number;
  source: 'صوت';
  createdBy: 'AI' | 'بشري';
  createdAt: string;
  updatedAt: string;
  appointmentTime?: string; // from backend format
  dayName?: string;         // from backend format
}

export interface EnhancedCampaign {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  successful_calls: number;
  progress: number;
  agent_type: 'sales' | 'support';
  concurrency_limit: number;
  use_knowledge_base: boolean;
  custom_system_prompt?: string;
  script_content: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  // Legacy fields for backward compatibility
  type?: 'صوتية' | 'رسائل';
  objective?: 'حجوزات' | 'تجديدات' | 'ترويج';
  audienceQuery?: string;
  scheduledAt?: string;
  metrics?: {
    reached: number;
    engaged: number;
    qualified: number;
    booked: number;
    revenue: number;
    roas: number;
  };
  attribution?: 'AI' | 'بشري';
  updatedAt?: string;
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
  roasChange?: number;
  avgHandleTimeChange?: number;
  csatChange?: number;
  monthlyTarget?: number;
  qualifiedCount?: number;
  aiAccuracy?: number;
  complianceRate?: number;
  qualityScore?: number;
}

export interface LiveOps {
  currentCalls: Array<{
    id: string;
    customerName: string;
    duration: string;
    status: 'وارد' | 'فائت';
  }>;
}

// ============================================================================
// BULK CALL CAMPAIGN TYPES
// ============================================================================

export interface BulkCallScript {
  id: string;
  name: string;
  description?: string;
  content: string; // Markdown or plain text
  variables: string[]; // e.g., ['customer_name', 'neighborhood', 'project']
  agentType: 'support' | 'sales';
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

export interface BulkCallCampaign {
  id: string;
  name: string;
  description?: string;
  scriptId: string;
  scriptContent: string;
  customerIds: string[];
  agentType: 'support' | 'sales';
  concurrencyLimit: number; // Max simultaneous calls
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkCallProgress {
  campaignId: string;
  totalCalls: number;
  completedCalls: number;
  successfulCalls: number;
  failedCalls: number;
  inProgressCalls: number;
  currentCallIndex: number;
  estimatedTimeRemaining?: number; // seconds
  currentCustomer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface BulkCallResult {
  callId: string;
  customerId: string;
  customerName: string;
  phone: string;
  status: 'success' | 'failed' | 'voicemail' | 'no_answer' | 'busy';
  duration?: number; // seconds
  recordingUrl?: string;
  error?: string;
  timestamp: string;
}

export interface BulkCallCampaignResults {
  campaignId: string;
  results: BulkCallResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgDuration?: number;
    totalDuration?: number;
    completedAt: string;
  }
}
// ============================================================================
// SCRIPTS MANAGEMENT TYPES
// ============================================================================

export interface Script extends BulkCallScript {
  category: 'marketing' | 'support' | 'renewal' | 'general' | 'custom';
  tags: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdBy: string;
  isActive: boolean;
  successRate?: number; // Percentage of successful calls using this script
  avgCallDuration?: number; // Average call duration in seconds
}

export interface ScriptCategory {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  count: number;
}

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  {
    id: 'marketing',
    name: 'Marketing',
    nameAr: 'تسويق',
    description: 'Promotional scripts for new projects and offers',
    icon: '📢',
    count: 0
  },
  {
    id: 'support',
    name: 'Support',
    nameAr: 'دعم',
    description: 'Customer service and support scripts',
    icon: '🎧',
    count: 0
  },
  {
    id: 'renewal',
    name: 'Renewal',
    nameAr: 'تجديد',
    description: 'Contract renewal and retention scripts',
    icon: '🔄',
    count: 0
  },
  {
    id: 'general',
    name: 'General',
    nameAr: 'عام',
    description: 'General purpose and inquiry scripts',
    icon: '💬',
    count: 0
  }
];
