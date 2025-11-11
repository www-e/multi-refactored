// src/app/page.tsx (Improved Version)
import Link from 'next/link'
import { Button } from '@/components/ui/button' // Import our shared button

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 mb-6">جاري التحميل...</p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            الذهاب إلى لوحة التحكم
          </Link>
        </Button>
      </div>
    </div>
  )
}