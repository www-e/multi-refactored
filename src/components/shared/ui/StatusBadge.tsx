import { cn } from '@/lib/utils';
import { TStatus } from './types';
import { Phone, Mail } from 'lucide-react';

interface StatusBadgeProps {
  status: TStatus;
  type?: 'pill' | 'icon';
}

const statusStyles: Record<TStatus, string> = {
  // Campaign & General Status
  نشطة: 'bg-success text-white',
  موقوفة: 'bg-warning text-white',
  مكتملة: 'bg-info text-white',
  // Customer Stage
  جديد: 'bg-blue-500 text-white',
  مؤهل: 'bg-yellow-500 text-white',
  حجز: 'bg-purple-500 text-white',
  ربح: 'bg-green-500 text-white',
  خسارة: 'bg-red-500 text-white',
  // Ticket Status
  مفتوحة: 'bg-blue-500 text-white',
  قيد_المعالجة: 'bg-yellow-500 text-white',
  بانتظار_الموافقة: 'bg-orange-500 text-white',
  محلولة: 'bg-green-500 text-white',
  // Booking Status
  معلق: 'bg-warning text-white',
  مؤكد: 'bg-success text-white',
  ملغي: 'bg-destructive text-white',
  // Priority
  عاجل: 'bg-red-700 text-white',
  عالٍ: 'bg-red-500 text-white',
  متوسط: 'bg-yellow-500 text-white',
  منخفض: 'bg-gray-500 text-white',
  // Attribution & Source
  AI: 'bg-primary text-white',
  بشري: 'bg-slate-600 text-white',
  صوت: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  رسالة: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

const iconMap: Partial<Record<TStatus, React.ReactNode>> = {
    صوت: <Phone className="w-4 h-4" />,
    رسالة: <Mail className="w-4 h-4" />,
};

export function StatusBadge({ status, type = 'pill' }: StatusBadgeProps) {
    if (type === 'icon' && iconMap[status]) {
        return (
            <span className={cn('text-xs px-2 py-1 rounded-full', statusStyles[status])}>
                {iconMap[status]}
            </span>
        )
    }

  return (
    <span
      className={cn(
        'inline-block px-2 py-1 rounded-full text-xs font-medium',
        statusStyles[status] || 'bg-gray-500 text-white'
      )}
    >
      {status}
    </span>
  );
}