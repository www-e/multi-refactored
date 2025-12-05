'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Plus, CheckCircle, XCircle,
  User, Edit, Eye, Trash2, MoreVertical,
  Phone, Mail, RefreshCw, Search, Filter
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Card } from '@/components/shared/ui/Card';
import BookingModal from '@/components/shared/modals/BookingModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { useModalState } from '@/hooks/useModalState';
import { mapBookingStatusToArabic } from '@/lib/statusMapper';

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Added status filter
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; customerName: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);

  const { bookings, customers, properties, setBookings, setBookingsLoading, updateBooking: updateBookingInStore, addBooking, removeBooking } = useAppStore();
  const { getBookings, updateBookingStatus, updateBookingStatusWithMapping, updateBooking, createBooking, deleteBooking, isAuthenticated } = useAuthApi();
  const { isSubmitting, handleModalSubmit } = useModalState();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setBookingsLoading(true);
          const data = await getBookings();
          setBookings(data);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        } finally {
          setBookingsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getBookings, setBookings, setBookingsLoading]);

  const handleEditBooking = (booking: any) => {
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
  };

  const handleDeleteBooking = (booking: { id: string; customerName: string }) => {
    setBookingToDelete(booking);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBooking(bookingToDelete.id);
      // Update the store to remove the booking
      removeBooking(bookingToDelete.id);
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('فشل حذف الحجز. يرجى المحاولة مرة أخرى.');
    }
  };

  // Type-Safe Lookups
  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getProperty = (id: string) => properties.find(p => p.id === id);

  const filteredBookings = bookings.filter(booking => {
    const customer = getCustomer(booking.customerId);
    const property = getProperty(booking.propertyId);
    const query = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || (
      customer?.name.toLowerCase().includes(query) ||
      customer?.phone.includes(query) ||
      property?.code.toLowerCase().includes(query)
    );

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Robust Status Check (Arabic + English)
  const isPending = (status: string) => ['pending', 'معلق'].includes(status.toLowerCase());

  const pendingBookings = filteredBookings.filter(b => isPending(b.status) && (statusFilter === 'all' || b.status === statusFilter));

  const handleAction = async (id: string, action: 'confirmed' | 'canceled') => {
    const arabicStatus = action === 'confirmed' ? 'مؤكد' : 'ملغي';
    await updateBookingStatus(id, action);
    updateBookingInStore(id, { status: arabicStatus });
  };

  const handleActionWithMapping = async (id: string, action: string) => {
    const arabicStatus = mapBookingStatusToArabic(action);
    await updateBookingStatusWithMapping(id, action);
    // Need to cast to the correct type since mapper returns string
    updateBookingInStore(id, { status: arabicStatus as 'معلق' | 'مؤكد' | 'ملغي' | 'مكتمل' });
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="الحجوزات والمواعيد" subtitle="إدارة حجوزات العملاء والمواعيد">
          <div className="flex gap-3">
             <ActionButton icon={RefreshCw} label="تحديث" variant="secondary" onClick={() => {
               const fetchData = async () => {
                 try {
                   setBookingsLoading(true);
                   const data = await getBookings();
                   setBookings(data);
                 } catch (error) {
                   console.error('Error refreshing bookings:', error);
                 } finally {
                   setBookingsLoading(false);
                 }
               };
               fetchData();
             }} />
             <ActionButton icon={Plus} label="حجز جديد" onClick={() => setIsAddModalOpen(true)} />
          </div>
        </PageHeader>

        {/* Toggle View */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-1 border border-white/20 dark:border-slate-700/20">
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400'}`}>جدول</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400'}`}>تقويم</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="البحث في الحجوزات..." onFilterClick={() => {}} />
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('all')}
            >
              الكل
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'معلق' ? 'bg-yellow-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('معلق')}
            >
              معلق
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'مؤكد' ? 'bg-green-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('مؤكد')}
            >
              مؤكد
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'ملغي' ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('ملغي')}
            >
              ملغي
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'مكتمل' ? 'bg-blue-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('مكتمل')}
            >
              مكتمل
            </button>
          </div>
        </div>

        {/* Pending Requests (Only show if they exist) */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">طلبات في انتظار الموافقة ({pendingBookings.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map(booking => {
                const customer = getCustomer(booking.customerId);
                const property = getProperty(booking.propertyId);
                return (
                  <Card key={booking.id} className="p-4">
                    <div className="flex justify-between mb-3">
                        <StatusBadge status={booking.createdBy} />
                        <span className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                        <h4 className="font-semibold">{customer?.name || 'عميل غير معروف'}</h4>
                        <p className="text-sm text-slate-600">{property?.code || booking.propertyId || '...'}</p>
                        <p className="text-lg font-bold text-primary">{(booking.price || 0).toLocaleString()} ر.س</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleAction(booking.id, 'confirmed')} className="flex-1 bg-success text-white p-2 rounded-lg hover:bg-success/90 text-sm flex items-center justify-center gap-2"><CheckCircle size={16}/> موافقة</button>
                        <button onClick={() => handleAction(booking.id, 'canceled')} className="flex-1 bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90 text-sm flex items-center justify-center gap-2"><XCircle size={16}/> رفض</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'table' ? (
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-right p-4">العميل</th>
                                <th className="text-right p-4">العقار</th>
                                <th className="text-right p-4">التاريخ</th>
                                <th className="text-right p-4">السعر</th>
                                <th className="text-right p-4">المصدر</th>
                                <th className="text-right p-4">الحالة</th>
                                <th className="text-right p-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredBookings.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">لا توجد حجوزات لعرضها</td></tr>
                            )}
                            {filteredBookings.map(booking => {
                                const customer = getCustomer(booking.customerId);
                                const property = getProperty(booking.propertyId);
                                return (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary"><User size={16}/></div>
                                                <div>
                                                    <p className="font-medium">{customer?.name || '...'}</p>
                                                    <p className="text-xs text-slate-500">{customer?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{property?.code || '...'}</p>
                                            <p className="text-xs text-slate-500">{property?.neighborhood}</p>
                                        </td>
                                        <td className="p-4 text-sm">{new Date(booking.startDate).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-4 font-semibold text-primary">{(booking.price || 0).toLocaleString()} ر.س</td>
                                        <td className="p-4"><StatusBadge status={booking.source} type="icon"/></td>
                                        <td className="p-4"><StatusBadge status={booking.status} /></td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedBooking(booking.id)} className="p-2 hover:bg-slate-100 rounded-lg"><Eye size={16}/></button>
                                                <button onClick={() => handleEditBooking(booking)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit size={16}/></button>
                                                <button onClick={() => handleDeleteBooking({id: booking.id, customerName: customer?.name || 'عميل'})} className="p-2 hover:bg-destructive/20 rounded-lg text-destructive"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        ) : (
            <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">عرض التقويم</h3>
                <p className="text-slate-500">سيتم تفعيل عرض التقويم قريباً</p>
            </Card>
        )}

        <BookingModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            customers={customers}
            title="إنشاء حجز جديد"
            onSubmit={async (data) => {
                await handleModalSubmit(async () => {
                    const res = await createBooking(data);
                    addBooking(res);
                    setIsAddModalOpen(false);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <BookingModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setBookingToEdit(null);
            }}
            title="تعديل الحجز"
            booking={bookingToEdit}
            customers={customers}
            onSubmit={async (data) => {
                if (!bookingToEdit) return;
                await handleModalSubmit(async () => {
                    const res = await updateBooking(bookingToEdit.id, data);
                    // Update the booking in the store
                    updateBookingInStore(bookingToEdit.id, res);
                    setIsEditModalOpen(false);
                    setBookingToEdit(null);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteBooking}
            title="حذف الحجز"
            message={`هل أنت متأكد من رغبتك في حذف الحجز للعميل "${bookingToDelete?.customerName}"؟`}
            itemName={bookingToDelete?.customerName}
            isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}