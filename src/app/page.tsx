import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shared/ui/Card';
import { LogIn } from 'lucide-react';

export default function HomePage() {
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
          <Link href="/api/auth/login">
            تسجيل الدخول
          </Link>
        </Button>
      </Card>
    </div>
  );
}