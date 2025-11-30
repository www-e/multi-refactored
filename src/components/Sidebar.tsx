'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Calendar,
  Users,
  BarChart3,
  Play,
  Settings,
  Bot,
  TrendingUp,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCog
} from 'lucide-react'

const navigation = [
  {
    name: 'لوحة التحكم',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'نظرة شاملة على الأداء'
  },
  {
    name: 'المحادثات',
    href: '/conversations',
    icon: MessageSquare,
    description: 'إدارة المكالمات والرسائل'
  },
  {
    name: 'المكالمات',
    href: '/calls',
    icon: Phone,
    description: 'سجل المكالمات الصادرة والواردة'
  },
  {
    name: 'التذاكر',
    href: '/tickets',
    icon: Ticket,
    description: 'متابعة الطلبات والدعم'
  },
  {
    name: 'الحجوزات',
    href: '/bookings',
    icon: Calendar,
    description: 'إدارة المواعيد والحجوزات'
  },
  {
    name: 'العملاء',
    href: '/customers',
    icon: Users,
    description: 'قاعدة بيانات العملاء'
  },
  {
    name: 'الحملات',
    href: '/campaigns',
    icon: BarChart3,
    description: 'إدارة الحملات التسويقية'
  },
  {
    name: 'التحليلات',
    href: '/analytics',
    icon: TrendingUp,
    description: 'تقارير الأداء والمؤشرات'
  },
  {
    name: 'ساحة التجربة',
    href: '/playground',
    icon: Play,
    description: 'تجربة المساعد الصوتي'
  },
  {
    name: 'مساعد خدمة العملاء',
    href: '/support-agent',
    icon: Bot,
    description: 'محاكاة تفاعلات خدمة العملاء'
  },
  {
    name: 'الإعدادات',
    href: '/settings',
    icon: Settings,
    description: 'تخصيص النظام'
  }
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (isCollapsed: boolean) => void
}

function UserProfile({ isCollapsed }: { isCollapsed: boolean }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === 'loading') return <div className="text-sm text-slate-500">جاري تحميل المستخدم...</div>;
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Show different UI based on collapsed state
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-2">
        <div className="relative group">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-700">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>

          {/* Tooltip for collapsed state */}
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs opacity-80">{user.email}</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>

        <a
          href="/api/auth/signout?callbackUrl=/"
          className="mt-3 relative group flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />

          {/* Tooltip for sign out button */}
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
            تسجيل الخروج
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
          <span className="font-bold text-slate-700">
            {user.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {isAdmin && (
          <span className="w-full flex items-center space-x-2 space-x-reverse p-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200">
            <UserCog className="w-4 h-4" />
            <span>صلاحيات المشرف</span>
          </span>
        )}
        <a
          href="/api/auth/signout?callbackUrl=/"
          className="w-full flex items-center space-x-2 space-x-reverse p-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </a>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200/50 dark:border-slate-700/50 z-50 transition-all duration-300 ease-in-out ${
          isMobile 
            ? isOpen 
              ? 'w-80 translate-x-0' 
              : 'w-80 translate-x-full'
            : isCollapsed 
              ? 'w-20' 
              : 'w-80'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 space-x-reverse transition-all duration-300 ${
              isCollapsed && !isMobile ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}>
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Agentic Navaia
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  المساعد الصوتي الذكي
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Collapse Button */}
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {isCollapsed ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Collapsed Logo */}
          {isCollapsed && !isMobile && (
            <div className="flex justify-center mt-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`${(isCollapsed && !isMobile) ? 'p-1' : 'p-4'} space-y-2 flex-1 overflow-y-auto`}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={`group flex items-center space-x-3 space-x-reverse p-3 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 ${
                  isCollapsed && !isMobile ? 'mx-auto' : ''
                } ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`} />
                
                {(!isCollapsed || isMobile) && (
                  <div className="flex-1 text-right">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && !isMobile && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-80">{item.description}</div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        {(!isCollapsed || isMobile) && (
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              إجراءات سريعة
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-2 space-x-reverse p-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200">
                <Phone className="w-4 h-4" />
                <span>مكالمة جديدة</span>
              </button>
              <button className="w-full flex items-center space-x-2 space-x-reverse p-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200">
                <Mail className="w-4 h-4" />
                <span>رسالة جديدة</span>
              </button>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className={`${(isCollapsed && !isMobile) ? 'p-1' : 'p-4'} border-t border-slate-200/50 dark:border-slate-700/50`}>
          <UserProfile isCollapsed={isCollapsed && !isMobile} />
        </div>
      </div>
    </>
  )
}
