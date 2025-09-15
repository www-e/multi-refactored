'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  DollarSign,
  MoreVertical,
  Edit,
  Eye,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table')
  
  const { bookings, customers, properties, approveBooking, rejectBooking, refreshBookings } = useAppStore()

  // Auto-refresh bookings on component mount
  useEffect(() => {
    refreshBookings()
  }, [refreshBookings])

  const getCustomerById = (id: string) => customers.find(c => c.id === id)
  const getPropertyById = (id: string) => properties.find(p => p.id === id)
  const getBookingById = (id: string) => bookings.find(b => b.id === id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مؤكد': return 'bg-success text-white'
      case 'معلق': return 'bg-warning text-white'
      case 'ملغي': return 'bg-destructive text-white'
      case 'مكتمل': return 'bg-info text-white'
      default: return 'bg-slate-500 text-white'
    }
  }

  const getSourceIcon = (source: string) => {
    return source === 'صوت' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />
  }

  const getCreatedByColor = (createdBy: string) => {
    return createdBy === 'AI' ? 'bg-primary text-white' : 'bg-slate-600 text-white'
  }

  const filteredBookings = bookings.filter(booking => {
    if (searchQuery) {
      const customer = getCustomerById(booking.customerId)
      const property = getPropertyById(booking.propertyId)
      return customer?.name.includes(searchQuery) || 
             customer?.phone.includes(searchQuery) ||
             property?.code.includes(searchQuery)
    }
    return true
  }).slice(0, 10) // Limit to max 10 bookings

  const pendingBookings = filteredBookings.filter(booking => booking.status === 'معلق')
  const confirmedBookings = filteredBookings.filter(booking => booking.status === 'مؤكد')

  const handleApproveBooking = (bookingId: string) => {
    approveBooking(bookingId)
  }

  const handleRejectBooking = (bookingId: string) => {
    rejectBooking(bookingId)
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              الحجوزات والمواعيد
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              إدارة حجوزات العملاء والمواعيد
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshBookings}
              className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
            
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200">
              <Plus className="w-4 h-4" />
              <span>حجز جديد</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-1 border border-white/20 dark:border-slate-700/20">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              تقويم
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في الحجوزات..."
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

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              طلبات في انتظار الموافقة ({pendingBookings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map((booking) => {
                const customer = getCustomerById(booking.customerId)
                const property = getPropertyById(booking.propertyId)
                
                if (!customer || !property) return null

                return (
                  <div key={booking.id} className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCreatedByColor(booking.createdBy)}`}>
                          {booking.createdBy}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {getSourceIcon(booking.source)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(booking.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{customer.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{property.code}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{property.neighborhood}</p>
                      <p className="text-lg font-bold text-primary">{booking.price.toLocaleString()} ر.س</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="flex-1 flex items-center justify-center space-x-2 space-x-reverse p-2 bg-success text-white rounded-lg hover:bg-success/90 transition-all duration-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">موافقة</span>
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="flex-1 flex items-center justify-center space-x-2 space-x-reverse p-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-all duration-200"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">رفض</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">العميل</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">العقار</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">التاريخ</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">السعر</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">المصدر</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الحالة</th>
                    <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredBookings.map((booking) => {
                    const customer = getCustomerById(booking.customerId)
                    const property = getPropertyById(booking.propertyId)
                    
                    if (!customer || !property) return null

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</p>
                              <p className="text-sm text-slate-500">{customer.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{property.code}</p>
                            <p className="text-sm text-slate-500">{property.neighborhood}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="text-slate-900 dark:text-slate-100">
                              {new Date(booking.startDate).toLocaleDateString('ar-SA')}
                            </p>
                            {booking.endDate && (
                              <p className="text-slate-500">
                                إلى {new Date(booking.endDate).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-primary">{booking.price.toLocaleString()} ر.س</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {getSourceIcon(booking.source)}
                            <span className={`text-xs px-2 py-1 rounded-full ${getCreatedByColor(booking.createdBy)}`}>
                              {booking.createdBy}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => setSelectedBooking(booking.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">عرض التقويم</h3>
              <p className="text-slate-600 dark:text-slate-400">
                سيتم إضافة عرض التقويم هنا قريباً
              </p>
            </div>
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">تفاصيل الحجز</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>

              {(() => {
                const booking = getBookingById(selectedBooking)
                const customer = booking ? getCustomerById(booking.customerId) : null
                const property = booking ? getPropertyById(booking.propertyId) : null
                
                if (!booking || !customer || !property) return null

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

                    {/* Property Info */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">تفاصيل العقار</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-slate-600 dark:text-slate-400">رمز العقار</label>
                          <p className="text-slate-900 dark:text-slate-100">{property.code}</p>
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-slate-400">الحي</label>
                          <p className="text-slate-900 dark:text-slate-100">{property.neighborhood}</p>
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-slate-400">الغرف</label>
                          <p className="text-slate-900 dark:text-slate-100">{property.bedrooms} غرف نوم</p>
                        </div>
                        <div>
                          <label className="text-slate-600 dark:text-slate-400">السعر الشهري</label>
                          <p className="text-slate-900 dark:text-slate-100">{property.monthlyPriceSAR.toLocaleString()} ر.س</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">تاريخ البداية</label>
                        <p className="text-slate-900 dark:text-slate-100">
                          {new Date(booking.startDate).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">تاريخ النهاية</label>
                        <p className="text-slate-900 dark:text-slate-100">
                          {booking.endDate ? new Date(booking.endDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">السعر</label>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold text-primary">
                          {booking.price.toLocaleString()} ر.س
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">المصدر</label>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getSourceIcon(booking.source)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getCreatedByColor(booking.createdBy)}`}>
                            {booking.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>

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