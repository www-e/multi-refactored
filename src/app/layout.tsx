// src/app/layout.tsx
import type { Metadata } from 'next'
import { Tajawal } from 'next/font/google'
// UserProvider is no longer needed in Auth0 SDK v4
// Client-side useUser hook works without it
import '@/styles/globals.css'
import ThemeToggle from '@/components/ThemeToggle'
import ClientLayout from '@/components/ClientLayout'

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
        <ClientLayout>
          {children}
        </ClientLayout>
        <ThemeToggle />
      </body>
    </html>
  )
}