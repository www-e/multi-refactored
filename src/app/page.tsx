'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shared/ui/Card';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function HomePage() {
  const { user, error, isLoading } = useUser();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      // Set user data for display
      setUserData(user);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 bg-white/50 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse w-3/4 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            خطأ في التوثيق
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-4 mb-8">
            {error.message || 'حدث خطأ أثناء تحميل معلومات المستخدم.'}
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/login">
              إعادة المحاولة
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (user) {
    // User is authenticated - show welcome message and dashboard button
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 text-white">
              {userData?.picture ? (
                <img
                  src={userData.picture}
                  alt={userData.name || 'User'}
                  className="w-full h-full rounded-full border-2 border-white/30"
                />
              ) : (
                <LayoutDashboard className="w-full h-full" />
              )}
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            مرحباً، {userData?.name || userData?.email?.split('@')[0] || 'مستخدم'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-4 mb-8">
            تم تسجيل الدخول بنجاح. يمكنك الآن الوصول إلى لوحة التحكم وإدارة العمليات.
          </p>
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard">
                الانتقال إلى لوحة التحكم
              </Link>
            </Button>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {userData?.email || ''}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // User is not authenticated - show login page
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
          بوابة المساعد الصوتي الذكية
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-4 mb-8">
          يرجى تسجيل الدخول للوصول إلى لوحة التحكم وإدارة العمليات.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/auth/login">
            تسجيل الدخول
          </Link>
        </Button>
      </Card>
    </div>
  );
}