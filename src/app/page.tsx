import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 mb-6">جاري التحميل...</p>
        <Link 
          href="/dashboard" 
          className="btn-primary text-lg px-8 py-3"
        >
          الذهاب إلى لوحة التحكم
        </Link>
      </div>
    </div>
  )
} 