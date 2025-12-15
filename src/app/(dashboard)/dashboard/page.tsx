'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import {
  Star, TrendingUp, BarChart3, MessageSquare, Users, Phone
} from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { DashboardStatsGrid } from '@/components/features/dashboard/DashboardStatsGrid';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import ErrorBoundary from '@/components/shared/ui/ErrorBoundary';
import { mapBookingStatusToArabic, mapTicketStatusToArabic, mapCampaignStatusToArabic } from '@/lib/statusMapper';
import { formatDate, formatSAR, formatTime } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const {
    dashboardKPIs,
    calls,
    dashboardLoading,
    setDashboardData,
    setDashboardLoading,
    setCalls
  } = useAppStore();

  const { getDashboardKpis, getCalls, isAuthenticated } = useAuthApi();

  const fetchAllData = useCallback(async () => {
    if (isAuthenticated) {
      setDashboardLoading(true);
      try {
        const [dashboardData, callsData] = await Promise.all([
          getDashboardKpis(),
          getCalls()
        ]);
        setDashboardData(dashboardData);
        setCalls(callsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setDashboardLoading(false);
      }
    }
  }, [isAuthenticated, getDashboardKpis, getCalls, setDashboardData, setCalls, setDashboardLoading]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Get the latest 4 calls, sorted by creation date (newest first)
  const latestCalls = calls
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const periods = [
    { value: '1d', label: 'اليوم' },
    { value: '7d', label: '7 أيام' },
    { value: '30d', label: '30 يوم' },
    { value: '90d', label: '90 يوم' },
  ];

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="لوحة التحكم"
          subtitle="نظرة شاملة على أداء المساعد الصوتي والعمليات"
        >
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </PageHeader>

        <ErrorBoundary>
          <DashboardStatsGrid kpis={dashboardKPIs} isLoading={dashboardLoading} />
        </ErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{dashboardKPIs.roas}x</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">ROAS</div>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success mr-1">{(dashboardKPIs.roasChange || 0) > 0 ? '+' : ''}{(dashboardKPIs.roasChange || 0)}%</span>
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {Math.floor(dashboardKPIs.avgHandleTime / 60)}:
              {(dashboardKPIs.avgHandleTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">زمن المعالجة (AHT)</div>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success mr-1">{(dashboardKPIs.avgHandleTimeChange || 0) > 0 ? '+' : ''}{dashboardKPIs.avgHandleTimeChange || 0}s</span>
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{dashboardKPIs.csat}/5</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">رضا العملاء (CSAT)</div>
            <div className="flex items-center justify-center mt-2">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning mr-1">{(dashboardKPIs.csatChange || 0) > 0 ? '+' : ''}{dashboardKPIs.csatChange || 0}</span>
            </div>
          </Card>
        </div>



        {/* Latest Calls Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>آخر المكالمات</CardTitle>
                  <p className="text-slate-600 dark:text-slate-400">عرض آخر 4 مكالمات</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/calls')}
                className="text-sm text-primary hover:underline"
              >
                عرض الكل
              </button>
            </div>
          </CardHeader>
          <div className="space-y-3 p-4">
            {latestCalls.length > 0 ? (
              latestCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/calls#${call.id}`)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      call.direction === 'صادر' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {call.customerId ? `مكالمة مع عميل` : 'مكالمة'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{call.direction}</span>
                        <span>•</span>
                        <span>{formatTime(call.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={call.status as any || 'unknown' as any}
                    />
                    {call.outcome && (
                      <StatusBadge
                        status={(() => {
                          // Map outcome to a status that has proper styling
                          switch(call.outcome) {
                            case 'booked':
                            case 'qualified':
                              return 'booked';
                            case 'ticket':
                              return 'ticket';
                            case 'info':
                              return 'info';
                            default:
                              return 'info'; // Default to info for unknown outcomes
                          }
                        })()}
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                لا توجد مكالمات حديثة
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>مسار التحويل</CardTitle>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">تم الوصول</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{dashboardKPIs.totalCalls}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">تفاعل</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.round((dashboardKPIs.totalCalls * dashboardKPIs.answerRate) / 100)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, dashboardKPIs.answerRate)}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">مؤهل</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{dashboardKPIs.qualifiedCount || 0}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, Math.round(dashboardKPIs.conversionToBooking))}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">حجز</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.round((dashboardKPIs.totalCalls * dashboardKPIs.conversionToBooking) / 100)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, dashboardKPIs.conversionToBooking)}%` }}></div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle className="mb-6">إجراءات سريعة</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/calls')}
              className="flex flex-col items-center p-4 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <Phone className="w-8 h-8 mb-2" />
              <span className="font-medium">محاكاة مكالمة</span>
            </button>
            <button
              onClick={() => router.push('/conversations')}
              className="flex flex-col items-center p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <MessageSquare className="w-8 h-8 mb-2" />
              <span className="font-medium">محاكاة رسالة</span>
            </button>
            <button
              onClick={() => router.push('/customers')}
              className="flex flex-col items-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <Users className="w-8 h-8 mb-2" />
              <span className="font-medium">إضافة عميل</span>
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="flex flex-col items-center p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <BarChart3 className="w-8 h-8 mb-2" />
              <span className="font-medium">تقرير جديد</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
