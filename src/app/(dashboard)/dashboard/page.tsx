'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Activity,
  Star,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Users,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { DashboardStatsGrid } from '@/components/features/dashboard/DashboardStatsGrid';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const {
    dashboardKPIs,
    liveOps,
    refreshAllData,
  } = useAppStore();

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

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

        <DashboardStatsGrid kpis={dashboardKPIs} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{dashboardKPIs.roas}x</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">ROAS</div>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-success mr-1">+0.3</span>
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
              <span className="text-sm text-success mr-1">-12s</span>
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{dashboardKPIs.csat}/5</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">رضا العملاء (CSAT)</div>
            <div className="flex items-center justify-center mt-2">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning mr-1">+0.2</span>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>العمليات الحية</CardTitle>
                <p className="text-slate-600 dark:text-slate-400">مراقبة المكالمات والرسائل في الوقت الفعلي</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success">
                {dashboardKPIs.systemStatus === 'AI_يعمل' ? 'AI يعمل' : 'التحويل للبشر'}
              </span>
            </div>
          </CardHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">المكالمات الحالية</h3>
              <div className="space-y-3">
                {liveOps.currentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                       <StatusBadge status={call.status as any} type="icon" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{call.customerName}</p>
                        <p className="text-sm text-slate-500">المدة: {call.duration}</p>
                      </div>
                    </div>
                    <StatusBadge status={call.status as any} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">الرسائل المحولة من AI</h3>
              <div className="space-y-3">
                {liveOps.aiTransferredChats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{chat.customerName}</p>
                        <p className="text-sm text-slate-500">{chat.reason}</p>
                      </div>
                    </div>
                    <span className="text-sm text-warning">انتظار: {chat.waitingTime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>مسار التحويل</CardTitle>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">تم الوصول</span><span className="font-semibold text-slate-900 dark:text-slate-100">350</span></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">تفاعل</span><span className="font-semibold text-slate-900 dark:text-slate-100">209</span></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">مؤهل</span><span className="font-semibold text-slate-900 dark:text-slate-100">112</span></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '32%' }}></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">حجز</span><span className="font-semibold text-slate-900 dark:text-slate-100">38</span></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: '11%' }}></div></div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات مقابل الهدف</CardTitle>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">الهدف الشهري</span><span className="font-semibold text-slate-900 dark:text-slate-100">2,000,000 ر.س</span></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '71%' }}></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">الإيرادات الفعلية</span><span className="font-semibold text-slate-900 dark:text-slate-100">1,420,000 ر.س</span></div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">71%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">من الهدف</div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle className="mb-6">إجراءات سريعة</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-white hover:scale-105 transition-transform duration-200">
              <Phone className="w-8 h-8 mb-2" />
              <span className="font-medium">محاكاة مكالمة</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:scale-105 transition-transform duration-200">
              <MessageSquare className="w-8 h-8 mb-2" />
              <span className="font-medium">محاكاة رسالة</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white hover:scale-105 transition-transform duration-200">
              <Users className="w-8 h-8 mb-2" />
              <span className="font-medium">إضافة عميل</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white hover:scale-105 transition-transform duration-200">
              <BarChart3 className="w-8 h-8 mb-2" />
              <span className="font-medium">تقرير جديد</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}