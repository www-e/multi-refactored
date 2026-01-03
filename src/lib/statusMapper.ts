// src/lib/statusMapper.ts
// Centralized utility for mapping between backend English values and frontend Arabic values

// Booking status mapping
export const mapBookingStatusToArabic = (status: string): string => {
  const mapping: Record<string, string> = {
    'pending': 'معلق',
    'confirmed': 'مؤكد',
    'canceled': 'ملغي',
    'completed': 'مكتمل',
    'معلق': 'معلق', // Handle if already Arabic
    'مؤكد': 'مؤكد',
    'ملغي': 'ملغي',
    'مكتمل': 'مكتمل',
  };
  return mapping[status] || status;
};

export const mapBookingStatusToEnglish = (status: string): string => {
  const mapping: Record<string, string> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'canceled': 'canceled',
    'completed': 'completed',
    'معلق': 'pending',
    'مؤكد': 'confirmed',
    'ملغي': 'canceled',
    'مكتمل': 'completed',
  };
  return mapping[status] || status;
};

// Ticket status mapping
export const mapTicketStatusToArabic = (status: string): string => {
  const mapping: Record<string, string> = {
    'open': 'مفتوحة',
    'in_progress': 'قيد_المعالجة',
    'resolved': 'محلولة',
    'closed': 'مغلقة',
    'مفتوحة': 'مفتوحة',
    'قيد_المعالجة': 'قيد_المعالجة',
    'محلولة': 'محلولة',
    'مغلقة': 'مغلقة',
  };
  return mapping[status] || status;
};

export const mapTicketStatusToEnglish = (status: string): string => {
  const mapping: Record<string, string> = {
    'open': 'open',
    'in_progress': 'in_progress',
    'resolved': 'resolved',
    'closed': 'closed',
    'مفتوحة': 'open',
    'قيد_المعالجة': 'in_progress',
    'محلولة': 'resolved',
    'مغلقة': 'closed',
  };
  return mapping[status] || status;
};

// Campaign status mapping
export const mapCampaignStatusToArabic = (status: string): string => {
  const mapping: Record<string, string> = {
    'active': 'نشطة',
    'paused': 'موقوفة',
    'completed': 'مكتملة',
    'نشطة': 'نشطة',
    'موقوفة': 'موقوفة',
    'مكتملة': 'مكتملة',
  };
  return mapping[status] || status;
};

export const mapCampaignStatusToEnglish = (status: string): string => {
  const mapping: Record<string, string> = {
    'active': 'active',
    'paused': 'paused',
    'completed': 'completed',
    'نشطة': 'active',
    'موقوفة': 'paused',
    'مكتملة': 'completed',
  };
  return mapping[status] || status;
};

// Channel type mapping (for bookings, campaigns)
export const mapChannelTypeToArabic = (type: string): string => {
  const mapping: Record<string, string> = {
    'voice': 'صوت',
    'صوت': 'صوت',
    'رسالة': 'رسالة',
  };
  return mapping[type] || type;
};

export const mapChannelTypeToEnglish = (type: string): string => {
  const mapping: Record<string, string> = {
    'voice': 'voice',
    'صوت': 'voice',
  };
  return mapping[type] || type;
};

// Campaign type mapping
export const mapCampaignTypeToArabic = (type: string): string => {
  const mapping: Record<string, string> = {
    'voice': 'صوتية',
    'صوتية': 'صوتية',
  };
  return mapping[type] || type;
};

export const mapCampaignTypeToEnglish = (type: string): string => {
  const mapping: Record<string, string> = {
    'voice': 'voice',
    'صوتية': 'voice',
  };
  return mapping[type] || type;
};

// Campaign objective mapping
export const mapCampaignObjectiveToArabic = (objective: string): string => {
  const mapping: Record<string, string> = {
    'bookings': 'حجوزات',
    'renewals': 'تجديدات',
    'leadgen': 'تحصيل_عملاء',
    'upsell': 'بيع_إضافي',
    'حجوزات': 'حجوزات',
    'تجديدات': 'تجديدات',
    'تحصيل_عملاء': 'تحصيل_عملاء',
    'بيع_إضافي': 'بيع_إضافي',
  };
  return mapping[objective] || objective;
};

export const mapCampaignObjectiveToEnglish = (objective: string): string => {
  const mapping: Record<string, string> = {
    'bookings': 'bookings',
    'renewals': 'renewals',
    'leadgen': 'leadgen',
    'upsell': 'upsell',
    'حجوزات': 'bookings',
    'تجديدات': 'renewals',
    'تحصيل_عملاء': 'leadgen',
    'بيع_إضافي': 'upsell',
  };
  return mapping[objective] || objective;
};

// Call status mapping
export const mapCallStatusToArabic = (status: string): string => {
  const mapping: Record<string, string> = {
    'connected': 'متصل',
    'no_answer': 'لا_إجابة',
    'abandoned': 'متروك',
    'unknown': 'غير_معروف',
    'متصل': 'متصل',
    'لا_إجابة': 'لا_إجابة',
    'متروك': 'متروك',
    'غير_معروف': 'غير_معروف',
  };
  return mapping[status] || status;
};

export const mapCallStatusToEnglish = (status: string): string => {
  const mapping: Record<string, string> = {
    'connected': 'connected',
    'no_answer': 'no_answer',
    'abandoned': 'abandoned',
    'unknown': 'unknown',
    'متصل': 'connected',
    'لا_إجابة': 'no_answer',
    'متروك': 'abandoned',
    'غير_معروف': 'unknown',
  };
  return mapping[status] || status;
};

// Ticket priority mapping
export const mapTicketPriorityToArabic = (priority: string): string => {
  const mapping: Record<string, string> = {
    'low': 'منخفض',
    'med': 'متوسط',
    'high': 'عالٍ',
    'urgent': 'عاجل',
    'منخفض': 'منخفض',
    'متوسط': 'متوسط',
    'عالٍ': 'عالٍ',
    'عاجل': 'عاجل',
  };
  return mapping[priority] || priority;
};

export const mapTicketPriorityToEnglish = (priority: string): string => {
  const mapping: Record<string, string> = {
    'low': 'low',
    'med': 'med',
    'high': 'high',
    'urgent': 'urgent',
    'منخفض': 'low',
    'متوسط': 'med',
    'عالٍ': 'high',
    'عاجل': 'urgent',
  };
  return mapping[priority] || priority;
};