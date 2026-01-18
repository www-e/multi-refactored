'use client';
import { Customer, EnhancedTicket, EnhancedBooking, EnhancedCampaign } from '@/app/(shared)/types';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDateTime, formatSAR } from '@/lib/utils';
import { User, Phone, Mail, Calendar, FileText, CheckCircle, Clock, MapPin, Wallet } from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  tickets: EnhancedTicket[];
  bookings: EnhancedBooking[];
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  tickets,
  bookings,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  // Filter related data for this customer
  const customerTickets = tickets.filter(ticket => ticket.customerId === customer.id);
  const customerBookings = bookings.filter(booking => booking.customerId === customer.id);

  const stageColors = {
    جديد: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    مؤهل: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    حجز: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    ربح: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    خسارة: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  // Calculate totals
  const totalBookingsValue = customerBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
  const completedBookings = customerBookings.filter(b => b.status === 'مكتمل' || b.status === 'مؤكد').length;
  const openTickets = customerTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل العميل: ${customer.name}`}>
      <div className="space-y-5">
        {/* Header Section with Stage Badge */}
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${stageColors[customer.stage]}`}>
            <User className="w-4 h-4" />
            <span className="font-medium">{customer.stage}</span>
          </div>
          {completedBookings > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{completedBookings} حجز مكتمل</span>
            </div>
          )}
          {openTickets > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{openTickets} تذكرة مفتوحة</span>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            معلومات العميل
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الاسم</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 text-lg">{customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <p className="font-medium text-slate-900 dark:text-slate-100" dir="ltr">{customer.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">البريد الإلكتروني</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <p className="font-medium text-slate-900 dark:text-slate-100">{customer.email || 'غير متوفر'}</p>
              </div>
            </div>
            {customer.budget && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الميزانية المتوقعة</p>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatSAR(customer.budget)}</p>
                </div>
              </div>
            )}
            {customer.neighborhoods && customer.neighborhoods.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الأحياء المفضلة</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {customer.neighborhoods.join('، ')}
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الإنشاء</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(customer.createdAt)}</p>
              </div>
            </div>
            {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آخر تحديث</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(customer.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consents Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            الموافقات والإعدادات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-700 dark:text-slate-300">التسويق</span>
              <span className={`text-sm font-medium ${customer.consents.marketing ? 'text-green-600' : 'text-slate-500'}`}>
                {customer.consents.marketing ? 'موافق' : 'غير موافق'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-700 dark:text-slate-300">التسجيل</span>
              <span className={`text-sm font-medium ${customer.consents.recording ? 'text-green-600' : 'text-slate-500'}`}>
                {customer.consents.recording ? 'موافق' : 'غير موافق'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-700 dark:text-slate-300">واتساب</span>
              <span className={`text-sm font-medium ${customer.consents.whatsapp ? 'text-green-600' : 'text-slate-500'}`}>
                {customer.consents.whatsapp ? 'موافق' : 'غير موافق'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">إجمالي الحجوزات</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{customerBookings.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">إجمالي التذاكر</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{customerTickets.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 mb-1">قيمة الحجوزات</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatSAR(totalBookingsValue)}</p>
          </div>
        </div>

        {/* Related Tickets */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            التذاكر ({customerTickets.length})
          </h3>
          {customerTickets.length > 0 ? (
            <div className="space-y-3">
              {customerTickets.map(ticket => (
                <div key={ticket.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{ticket.category}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{ticket.issue}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(ticket.createdAt)}
                    </span>
                    {ticket.assignee && (
                      <span>المسؤول: {ticket.assignee}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد تذاكر</p>
            </div>
          )}
        </div>

        {/* Related Bookings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            الحجوزات ({customerBookings.length})
          </h3>
          {customerBookings.length > 0 ? (
            <div className="space-y-3">
              {customerBookings.map(booking => (
                <div key={booking.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{booking.project || booking.propertyId}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500" dir="ltr">{booking.id}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-slate-600 dark:text-slate-400">{formatDateTime(booking.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">{formatSAR(booking.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد حجوزات</p>
            </div>
          )}
        </div>

        {/* Customer ID Reference */}
        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            رقم العميل: <span className="font-mono font-medium text-slate-700 dark:text-slate-300" dir="ltr">{customer.id}</span>
          </p>
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
        >
          إغلاق
        </button>
      </div>
    </Modal>
  );
}
