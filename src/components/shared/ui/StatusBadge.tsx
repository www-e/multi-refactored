import { cn } from '@/lib/utils';
import { TStatus } from './types';
import { Phone, Mail } from 'lucide-react';

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
  'pending_approval': 'bg-orange-500 text-white',
  'بانتظار_الموافقة': 'bg-orange-500 text-white',
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
  return (
    <span
      className={cn(
        'inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        statusStyles[status] || 'bg-gray-500 text-white'
      )}
    >
      {status}
    </span>
  );
}