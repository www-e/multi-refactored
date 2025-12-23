'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(false) // Reset collapse state on mobile
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Calculate the appropriate margin based on sidebar state
  const getMainMargin = () => {
    if (isMobile) {
      // On mobile, apply margin only when sidebar is open (push content approach)
      return sidebarOpen ? 'mr-80' : 'mr-0'
    }
    // On desktop, apply margin based on sidebar collapsed state
    if (sidebarCollapsed) return 'mr-20'
    return 'mr-64' // Updated width to match new sidebar
  }

  return (
    <div id="__app" className="min-h-screen flex">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Agentic Navaia
          </h1>
          <div className="w-10 h-10" /> {/* Spacer for balance */}
        </div>
      </div>

      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${getMainMargin()} ${
          isMobile ? 'pt-16' : ''
        }`}
        style={{
          // Add CSS variable for sidebar width to be used in other components if needed
          '--sidebar-width': isMobile ? '0px' : (sidebarCollapsed ? '5rem' : '16rem')
        } as React.CSSProperties}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
