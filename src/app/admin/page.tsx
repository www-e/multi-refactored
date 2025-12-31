'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  Settings,
  BarChart3,
  MessageSquare,
  Ticket,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">غير مصرح لك بالوصول إلى هذه الصفحة</div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: 'إدارة المستخدمين',
      description: 'إنشاء وتعديل وحذف حسابات المستخدمين',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    },
    {
      title: 'الأمان',
      description: 'إدارة صلاحيات الوصول والتحكم في الأذونات',
      icon: Shield,
      link: '/admin/security',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    },
    {
      title: 'الإعدادات',
      description: 'تهيئة إعدادات النظام والتكوينات العامة',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300',
    },
    {
      title: 'التحليلات',
      description: 'عرض تقارير الأداء والإحصائيات',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    },
    {
      title: 'المحادثات',
      description: 'إدارة المحادثات والدردشات',
      icon: MessageSquare,
      link: '/admin/conversations',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300',
    },
    {
      title: 'التذاكر',
      description: 'إدارة تذاكر الدعم الفني',
      icon: Ticket,
      link: '/admin/tickets',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300',
    },
    {
      title: 'الحجوزات',
      description: 'إدارة حجوزات العملاء',
      icon: Calendar,
      link: '/admin/bookings',
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300',
    },
    {
      title: 'المكالمات',
      description: 'إدارة سجل المكالمات',
      icon: Phone,
      link: '/admin/calls',
      color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">لوحة تحكم المشرف</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          مرحباً، {session.user.name}! هذه لوحة التحكم الخاصة بالمشرف
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link key={index} href={feature.link} className="block">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200 h-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {feature.description}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  الذهاب إلى {feature.title}
                </Button>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-12">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            معلومات النظام
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-700 dark:text-slate-300">عدد المستخدمين</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">12</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-700 dark:text-slate-300">عدد المكالمات اليوم</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">24</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-700 dark:text-slate-300">نسبة التحويل</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">12%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}