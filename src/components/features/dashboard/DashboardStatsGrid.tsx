import { StatsCard } from '@/components/shared/ui/StatsCard';
import { IStatsCard } from '@/components/shared/ui/types';
import { Phone, CheckCircle, Target, DollarSign } from 'lucide-react';

interface DashboardStatsGridProps {
  kpis: {
    totalCalls: number;
    answerRate: number;
    conversionToBooking: number;
    revenue: number;
  };
}

export function DashboardStatsGrid({ kpis }: DashboardStatsGridProps) {
  const stats: IStatsCard[] = [
    {
      label: 'الاتصالات المنفذة',
      value: kpis.totalCalls.toLocaleString(),
      change: 12, // Example static change
      period: 'من الفترة السابقة',
      icon: Phone,
      iconBgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    },
    {
      label: 'معدل الإجابة',
      value: `${kpis.answerRate}%`,
      change: 5, // Example static change
      period: 'من الفترة السابقة',
      icon: CheckCircle,
      iconBgColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    },
    {
      label: 'التحويل إلى حجز',
      value: `${kpis.conversionToBooking}%`,
      change: 8, // Example static change
      period: 'من الفترة السابقة',
      icon: Target,
      iconBgColor: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
    {
      label: 'الإيرادات',
      value: `${kpis.revenue.toLocaleString()} ر.س`,
      change: 15, // Example static change
      period: 'من الفترة السابقة',
      icon: DollarSign,
      iconBgColor: 'bg-gradient-to-r from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}