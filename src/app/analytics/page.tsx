'use client';

import { useState } from 'react';
import {
  Activity,
  Download,
  Phone,
  Clock,
  Star,
  Users,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { StatsCard } from '@/components/shared/ui/StatsCard';
import { IStatsCard } from '@/components/shared/ui/types';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { ActionButton } from '@/components/shared/ui/ActionButton';

// This could be extracted to a separate file, e.g., src/app/analytics/constants.ts
const TABS = [
  { id: 'operations', label: 'العمليات', icon: Activity },
  { id: 'marketing', label: 'التسويق', icon: Target },
  { id: 'qa', label: 'الجودة والامتثال', icon: Star },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<string>('operations');
  const { dashboardKPIs, campaigns } = useAppStore();

  const operationStats: IStatsCard[] = [
    {
      label: 'حجم المكالمات',
      value: dashboardKPIs.totalCalls.toLocaleString(),
      change: 12,
      period: 'من الفترة السابقة',
      icon: Phone,
      iconBgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    },
    {
      label: 'متوسط وقت المعالجة',
      value: `${Math.floor(dashboardKPIs.avgHandleTime / 60)}:${(
        dashboardKPIs.avgHandleTime % 60
      )
        .toString()
        .padStart(2, '0')}`,
      change: -8,
      period: 'من الفترة السابقة',
      icon: Clock,
      iconBgColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    },
    {
      label: 'رضا العملاء',
      value: `${dashboardKPIs.csat}/5`,
      change: 5,
      period: 'من الفترة السابقة',
      icon: Star,
      iconBgColor: 'bg-gradient-to-r from-purple-500 to-pink-600',
    },
    {
      label: 'معدل الإجابة',
      value: `${dashboardKPIs.answerRate}%`,
      change: 3,
      period: 'من الفترة السابقة',
      icon: Users,
      iconBgColor: 'bg-gradient-to-r from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="التحليلات"
          subtitle="تقارير الأداء والمؤشرات الشاملة"
        >
          {/* We will refactor this date range picker into a component later if needed */}
          <div className="flex items-center gap-2">
            {['اليوم', '7 أيام', '30 يوم', '90 يوم'].map((label) => (
              <button
                key={label}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
              >
                {label}
              </button>
            ))}
          </div>
          <ActionButton
            icon={Download}
            label="تصدير"
            onClick={() => alert('Exporting...')}
            variant="secondary"
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20"
          />
        </PageHeader>

        <Card className="p-2 mb-6">
          <div className="flex space-x-1 space-x-reverse">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'operations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {operationStats.map((stat) => (
                  <StatsCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
             <p className="text-center text-slate-500">Marketing content will be refactored here.</p>
          )}

          {activeTab === 'qa' && (
             <p className="text-center text-slate-500">QA content will be refactored here.</p>
          )}
        </div>
      </div>
    </div>
  );
}