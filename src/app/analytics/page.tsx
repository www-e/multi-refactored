'use client';

import { useState, useEffect } from 'react';
import { Activity, Target, Star, Phone, Clock, Users, Download, BarChart3, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card } from '@/components/shared/ui/Card';
import { StatsCard } from '@/components/shared/ui/StatsCard';
import { ActionButton } from '@/components/shared/ui/ActionButton';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'operations' | 'marketing' | 'qa'>('operations');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  const { dashboardKPIs, campaigns, setDashboardData, setDashboardLoading } = useAppStore();
  const { getDashboardKpis, isAuthenticated } = useAuthApi();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setDashboardLoading(true);
          const data = await getDashboardKpis();
          setDashboardData(data);
        } catch (error) {
          console.error('Error fetching analytics data:', error);
        } finally {
          setDashboardLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getDashboardKpis, setDashboardData, setDashboardLoading]);

  const tabs = [
    { id: 'operations', label: 'العمليات', icon: Activity },
    { id: 'marketing', label: 'التسويق', icon: Target },
    { id: 'qa', label: 'الجودة والامتثال', icon: Star }
  ];

  // Helper to handle zero/null values gracefully without breaking UI
  const safeVal = (val: number | undefined) => val || 0;

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="التحليلات" subtitle="تقارير الأداء والمؤشرات الشاملة">
          <div className="flex items-center gap-2">
            {['1d', '7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {period === '1d' ? 'اليوم' : period === '7d' ? '7 أيام' : period === '30d' ? '30 يوم' : '90 يوم'}
              </button>
            ))}
            <ActionButton icon={Download} label="تصدير" variant="secondary" />
          </div>
        </PageHeader>

        <Card className="p-2">
          <div className="flex space-x-1 space-x-reverse">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                label="حجم المكالمات"
                value={safeVal(dashboardKPIs.totalCalls).toLocaleString()}
                change={safeVal(dashboardKPIs.totalCallsChange)}
                period="من الفترة السابقة"
                icon={Phone}
                iconBgColor="bg-gradient-to-r from-blue-500 to-indigo-600"
              />
              <StatsCard
                label="متوسط وقت المعالجة"
                value={`${Math.floor(safeVal(dashboardKPIs.avgHandleTime) / 60)}:${(safeVal(dashboardKPIs.avgHandleTime) % 60).toString().padStart(2, '0')}`}
                change={safeVal(dashboardKPIs.avgHandleTimeChange)}
                period="من الفترة السابقة"
                icon={Clock}
                iconBgColor="bg-gradient-to-r from-emerald-500 to-teal-600"
              />
              <StatsCard
                label="رضا العملاء"
                value={`${safeVal(dashboardKPIs.csat)}/5`}
                change={safeVal(dashboardKPIs.csatChange)}
                period="من الفترة السابقة"
                icon={Star}
                iconBgColor="bg-gradient-to-r from-purple-500 to-pink-600"
              />
              <StatsCard
                label="معدل الإجابة"
                value={`${safeVal(dashboardKPIs.answerRate)}%`}
                change={safeVal(dashboardKPIs.answerRateChange)}
                period="من الفترة السابقة"
                icon={Users}
                iconBgColor="bg-gradient-to-r from-orange-500 to-red-600"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-80 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>رسم بياني لحجم المكالمات (قريباً)</p>
                    </div>
                </Card>
                <Card className="h-80 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>أداء اتفاقية مستوى الخدمة (SLA)</p>
                    </div>
                </Card>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">أداء الحملات</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-right p-3 font-semibold">الحملة</th>
                      <th className="text-right p-3 font-semibold">الوصول</th>
                      <th className="text-right p-3 font-semibold">التفاعل</th>
                      <th className="text-right p-3 font-semibold">الإيرادات</th>
                      <th className="text-right p-3 font-semibold">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-medium">{campaign.name}</td>
                        <td className="p-3">{campaign.metrics.reached}</td>
                        <td className="p-3">{campaign.metrics.engaged}</td>
                        <td className="p-3">{campaign.metrics.revenue.toLocaleString()} ر.س</td>
                        <td className="p-3 text-primary font-bold">{campaign.metrics.roas}x</td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد حملات نشطة</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center p-6">
                    <div className="text-3xl font-bold text-primary mb-2">{safeVal(dashboardKPIs.aiAccuracy)}%</div>
                    <div className="text-sm text-slate-600">دقة الذكاء الاصطناعي</div>
                </Card>
                <Card className="text-center p-6">
                    <div className="text-3xl font-bold text-success mb-2">{safeVal(dashboardKPIs.complianceRate)}%</div>
                    <div className="text-sm text-slate-600">الامتثال للنص</div>
                </Card>
                <Card className="text-center p-6">
                    <div className="text-3xl font-bold text-info mb-2">{dashboardKPIs.qualityScore ? `${dashboardKPIs.qualityScore}/5` : '-/5'}</div>
                    <div className="text-sm text-slate-600">تقييم الجودة الآلي</div>
                </Card>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}