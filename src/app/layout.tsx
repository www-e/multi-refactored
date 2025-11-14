// src/app/layout.tsx
import type { Metadata } from 'next'
import { Tajawal } from 'next/font/google'
import AuthProvider from '@/components/auth/AuthProvider';
import '@/styles/globals.css'
import ThemeToggle from '@/components/ThemeToggle'
import ClientLayout from '@/components/ClientLayout'
import ErrorBoundary from '@/components/shared/ui/ErrorBoundary'

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400','500','700','800'] })

export const metadata: Metadata = {
  title: 'Agentic Navaia - بوابة المساعد الصوتي الذكية',
  description: 'بوابة متكاملة لإدارة المساعد الصوتي بالذكاء الاصطناعي لشركات تأجير العقارات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.className} bg-background text-foreground`}>
        <AuthProvider>
          <ErrorBoundary>
            <ClientLayout>
              {children}
            </ClientLayout>
            <ThemeToggle />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}