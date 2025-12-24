import { cn } from '@/lib/utils';
import { TStatus } from './types';
import { Phone, Mail } from 'lucide-react';
import { mapTicketPriorityToArabic, mapTicketStatusToArabic, mapBookingStatusToArabic, mapCampaignStatusToArabic, mapCallStatusToArabic, mapChannelTypeToArabic } from '@/lib/statusMapper';

interface StatusBadgeProps {
  status: TStatus;
  type?: 'pill' | 'icon';
}

const statusStyles: Partial<Record<TStatus, string>> = {
  // Campaign & General Status
  'نشطة': 'bg-success text-white',
  'موقوفة': 'bg-warning text-white',
  'مكتملة': 'bg-info text-white',
  'مكتمل': 'bg-info text-white',
  'completed': 'bg-info text-white',
  // Customer Stage
  'جديد': 'bg-blue-500 text-white',
  'مؤهل': 'bg-yellow-500 text-white',
  'حجز': 'bg-purple-500 text-white',
  'ربح': 'bg-green-500 text-white',
  'خسارة': 'bg-red-500 text-white',
  // Ticket Status
  'open': 'bg-blue-500 text-white',
  'مفتوحة': 'bg-blue-500 text-white',
  'in_progress': 'bg-yellow-500 text-white',
  'قيد_المعالجة': 'bg-yellow-500 text-white',
  'resolved': 'bg-green-500 text-white',
  'محلولة': 'bg-green-500 text-white',
  // Booking Status
  'pending': 'bg-warning text-white',
  'معلق': 'bg-warning text-white',
  'confirmed': 'bg-success text-white',
  'مؤكد': 'bg-success text-white',
  'canceled': 'bg-destructive text-white',
  'ملغي': 'bg-destructive text-white',
  // Priority
  'urgent': 'bg-red-700 text-white',
  'عاجل': 'bg-red-700 text-white',
  'high': 'bg-red-500 text-white',
  'عالٍ': 'bg-red-500 text-white',
  'med': 'bg-yellow-500 text-white',
  'متوسط': 'bg-yellow-500 text-white',
  'low': 'bg-gray-500 text-white',
  'منخفض': 'bg-gray-500 text-white',
  // Attribution & Source
  'AI': 'bg-primary text-white',
  'بشري': 'bg-slate-600 text-white',
  'Human': 'bg-slate-600 text-white',
  'voice': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  'صوت': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  'chat': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  'رسالة': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  'web': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  'visit': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  // LiveOps Call Status (for current calls)
  'وارد': 'bg-blue-500 text-white',
  'فائت': 'bg-red-500 text-white',
  // Call Outcomes
  'qualified': 'bg-purple-500 text-white',
  'booked': 'bg-green-500 text-white',
  'ticket': 'bg-yellow-500 text-white',
  'info': 'bg-slate-500 text-white',
  'raised_ticket': 'bg-yellow-500 text-white',
};

const iconMap: Partial<Record<TStatus, React.ReactNode>> = {
    'voice': <Phone className="w-4 h-4" />,
    'صوت': <Phone className="w-4 h-4" />,
    'chat': <Mail className="w-4 h-4" />,
    'رسالة': <Mail className="w-4 h-4" />,
};

export function StatusBadge({ status, type = 'pill' }: StatusBadgeProps) {
    if (type === 'icon' && status in iconMap) {
        return (
            <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full', statusStyles[status])}>
                {iconMap[status]}
            </span>
        )
    }

    // Translate the status to Arabic if it's a known status type
    const getTranslatedStatus = (status: TStatus): string => {
      // Check if it's a ticket priority
      if (['low', 'med', 'high', 'urgent', 'منخفض', 'متوسط', 'عالٍ', 'عاجل'].includes(status)) {
        return mapTicketPriorityToArabic(status);
      }
      // Check if it's a ticket status
      if (['open', 'in_progress', 'resolved', 'closed', 'مفتوحة', 'قيد_المعالجة', 'محلولة', 'مغلقة'].includes(status)) {
        return mapTicketStatusToArabic(status);
      }
      // Check if it's a booking status
      if (['pending', 'confirmed', 'canceled', 'completed', 'معلق', 'مؤكد', 'ملغي', 'مكتمل'].includes(status)) {
        return mapBookingStatusToArabic(status);
      }
      // Check if it's a campaign status
      if (['active', 'paused', 'completed', 'نشطة', 'موقوفة', 'مكتملة'].includes(status)) {
        return mapCampaignStatusToArabic(status);
      }
      // Check if it's a call status
      if (['connected', 'no_answer', 'abandoned', 'unknown', 'متصل', 'لا_إجابة', 'متروك', 'غير_معروف'].includes(status)) {
        return mapCallStatusToArabic(status);
      }
      // Check if it's a channel type
      if (['voice', 'chat', 'صوت', 'رسالة'].includes(status)) {
        return mapChannelTypeToArabic(status);
      }
      // If it's already in Arabic or not a known status, return as is
      return status;
    };

  return (
    <span
      className={cn(
        'inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        statusStyles[status] || 'bg-gray-500 text-white'
      )}
    >
      {getTranslatedStatus(status)}
    </span>
  );
}