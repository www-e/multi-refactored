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
    'pending_approval': 'بانتظار_الموافقة',
    'resolved': 'محلولة',
    'closed': 'مغلقة',
    'مفتوحة': 'مفتوحة',
    'قيد_المعالجة': 'قيد_المعالجة',
    'بانتظار_الموافقة': 'بانتظار_الموافقة',
    'محلولة': 'محلولة',
    'مغلقة': 'مغلقة',
  };
  return mapping[status] || status;
};

export const mapTicketStatusToEnglish = (status: string): string => {
  const mapping: Record<string, string> = {
    'open': 'open',
    'in_progress': 'in_progress',
    'pending_approval': 'pending_approval',
    'resolved': 'resolved',
    'closed': 'closed',
    'مفتوحة': 'open',
    'قيد_المعالجة': 'in_progress',
    'بانتظار_الموافقة': 'pending_approval',
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