import { StatsCard } from '@/components/shared/ui/StatsCard';
import { IStatsCard } from '@/components/shared/ui/types';
import { Phone, CheckCircle, Target, DollarSign } from 'lucide-react';

interface DashboardStatsGridProps {
  kpis: {
    totalCalls: number;
    answerRate: number;
    conversionToBooking: number;
    revenue: number;
    totalCallsChange?: number;
    answerRateChange?: number;
    conversionChange?: number;
    revenueChange?: number;
  };
  isLoading?: boolean;
}

export function DashboardStatsGrid({ kpis, isLoading = false }: DashboardStatsGridProps) {
  const stats: IStatsCard[] = [
    {
      label: 'الاتصالات المنفذة',
      value: (kpis.totalCalls || 0).toLocaleString(),
      change: kpis.totalCallsChange || 0,
      period: 'من الفترة السابقة',
      icon: Phone,
      iconBgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    },
    {
      label: 'معدل الإجابة',
      value: `${(kpis.answerRate || 0).toFixed(1)}%`,
      change: kpis.answerRateChange || 0,
      period: 'من الفترة السابقة',
      icon: CheckCircle,
      iconBgColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    },
    {
      label: 'التحويل إلى حجز',
      value: `${(kpis.conversionToBooking || 0).toFixed(1)}%`,
      change: kpis.conversionChange || 0,
      period: 'من الفترة السابقة',
      icon: Target,
      iconBgColor: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
    {
      label: 'الإيرادات',
      value: `${(kpis.revenue || 0).toLocaleString()} ر.س`,
      change: kpis.revenueChange || 0,
      period: 'من الفترة السابقة',
      icon: DollarSign,
      iconBgColor: 'bg-gradient-to-r from-orange-500 to-red-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
              <div className="w-12 h-12 rounded-full bg-slate-200/60 dark:bg-slate-700/60 animate-pulse"></div>
            </div>
            <div className="mt-4 h-6 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
            <div className="mt-2 h-4 w-20 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}