'use client'

import { useState, useEffect } from 'react'
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
    const { tickets, customers, properties, assignTicket, resolveTicket, approveTicket, refreshTickets } = useAppStore()

  // Auto-refresh tickets on component mount
  useEffect(() => {
    refreshTickets()
  }, [refreshTickets])

  const columns = [
    { id: 'مفتوحة', title: 'مفتوحة', color: 'bg-blue-500' },
    { id: 'قيد_المعالجة', title: 'قيد المعالجة', color: 'bg-warning' },
    { id: 'بانتظار_الموافقة', title: 'بانتظار الموافقة', color: 'bg-orange-500' },
    { id: 'محلولة', title: 'محلولة', color: 'bg-success' }
  ]

  const getCustomerById = (id: string) => customers.find(c => c.id === id)
  const getPropertyById = (id: string) => properties.find(p => p.id === id)
  const getTicketById = (id: string) => tickets.find(t => t.id === id)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'عاجل': return 'bg-destructive text-white'
      case 'عالٍ': return 'bg-warning text-white'
      case 'متوسط': return 'bg-info text-white'
      case 'منخفض': return 'bg-slate-500 text-white'
      default: return 'bg-slate-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'كهرباء': return '⚡'
      case 'سباكة': return '🚰'
      case 'مفاتيح': return '🔑'
      case 'تنظيف': return '🧹'
      default: return '📋'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مفتوحة': return 'text-blue-500'
      case 'قيد_المعالجة': return 'text-warning'
      case 'بانتظار_الموافقة': return 'text-orange-500'
      case 'محلولة': return 'text-success'
      default: return 'text-slate-500'
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (searchQuery) {
      const customer = getCustomerById(ticket.customerId)
      return customer?.name.includes(searchQuery) || 
             ticket.category.includes(searchQuery) ||
             ticket.priority.includes(searchQuery)
    }
    return true
  }).slice(0, 10) // Limit to max 10 tickets

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    assignTicket(ticketId, assignee)
  }

  const handleResolveTicket = (ticketId: string, resolution: string) => {
    resolveTicket(ticketId, resolution)
  }

  const handleApproveTicket = (ticketId: string) => {
    approveTicket(ticketId, 'المدير')
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              التذاكر
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              إدارة طلبات الدعم والصيانة
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshTickets}
              className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>تذكرة جديدة</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في التذاكر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-200">
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const columnTickets = filteredTickets.filter(ticket => ticket.status === column.id)
            
            return (
              <div key={column.id} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{column.title}</h3>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-sm">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Tickets in Column */}
                <div className="space-y-3">
                  {columnTickets.map((ticket) => {
                    const customer = getCustomerById(ticket.customerId)
                    const property = ticket.propertyId ? getPropertyById(ticket.propertyId) : null
                    
                    if (!customer) return null

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          selectedTicket === ticket.id ? 'ring-2 ring-primary/50' : ''
                        }`}
                      >
                        {/* Ticket Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-lg">{getCategoryIcon(ticket.category)}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </div>

                        {/* Ticket Content */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {customer.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {ticket.category}
                          </p>
                          
                          {property && (
                            <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span>{property.neighborhood}</span>
                            </div>
                          )}

                          {/* SLA Warning */}
                          {new Date(ticket.slaDueAt) < new Date() && (
                            <div className="flex items-center space-x-2 space-x-reverse text-xs text-destructive">
                              <Clock className="w-3 h-3" />
                              <span>تجاوزت الموعد المحدد</span>
                            </div>
                          )}

                          {/* Assignee */}
                          {ticket.assignee && (
                            <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500">
                              <User className="w-3 h-3" />
                              <span>{ticket.assignee}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions based on status */}
                        {ticket.status === 'مفتوحة' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssignTicket(ticket.id, 'أحمد الصيانة')
                              }}
                              className="w-full text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-all duration-200"
                            >
                              تعيين
                            </button>
                          </div>
                        )}

                        {ticket.status === 'قيد_المعالجة' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolveTicket(ticket.id, 'تم حل المشكلة')
                              }}
                              className="w-full text-xs bg-warning text-white px-3 py-1 rounded-lg hover:bg-warning/90 transition-all duration-200"
                            >
                              حل
                            </button>
                          </div>
                        )}

                        {ticket.status === 'بانتظار_الموافقة' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproveTicket(ticket.id)
                              }}
                              className="w-full text-xs bg-success text-white px-3 py-1 rounded-lg hover:bg-success/90 transition-all duration-200"
                            >
                              موافقة
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">تفاصيل التذكرة</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>

              {(() => {
                const ticket = getTicketById(selectedTicket)
                const customer = ticket ? getCustomerById(ticket.customerId) : null
                const property = ticket?.propertyId ? getPropertyById(ticket.propertyId) : null
                
                if (!ticket || !customer) return null

                return (
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center space-x-3 space-x-reverse mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{customer.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{customer.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الفئة</label>
                        <p className="text-slate-900 dark:text-slate-100">{ticket.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الأولوية</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الحالة</label>
                        <p className={`text-sm ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الموعد المحدد</label>
                        <p className="text-slate-900 dark:text-slate-100">
                          {new Date(ticket.slaDueAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>

                    {/* Property Info */}
                    {property && (
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">العقار</label>
                        <p className="text-slate-900 dark:text-slate-100">{property.code}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{property.neighborhood}</p>
                      </div>
                    )}

                    {/* Resolution Note */}
                    {ticket.resolutionNote && (
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">ملاحظات الحل</label>
                        <p className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          {ticket.resolutionNote}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button className="flex-1 flex items-center justify-center space-x-2 space-x-reverse p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200">
                        <Edit className="w-4 h-4" />
                        <span>تعديل</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-2 space-x-reverse p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                        <Eye className="w-4 h-4" />
                        <span>عرض</span>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 