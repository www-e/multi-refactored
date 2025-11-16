'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, Edit, Eye, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useModalState } from '@/hooks/useModalState';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { DataTable } from '@/components/shared/data/DataTable';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';
import BookingModal from '@/components/shared/modals/BookingModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { Card } from '@/components/shared/ui/Card';
import { EnhancedBooking } from '@/app/(shared)/types';
import ErrorBoundary from '@/components/shared/ui/ErrorBoundary';

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<EnhancedBooking | null>(null);
  const [editingBooking, setEditingBooking] = useState<EnhancedBooking | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<EnhancedBooking | null>(null);

  const { bookings, customers, properties, bookingsLoading, setBookings, setBookingsLoading, removeBooking } = useAppStore();
  const { getBookings, createBooking, updateBooking, deleteBooking, isAuthenticated } = useAuthApi();
  const { modalError, isSubmitting, handleModalSubmit } = useModalState();

  const handleRefresh = useCallback(async () => {
    if (isAuthenticated) {
      setBookingsLoading(true);
      try {
        const data = await getBookings();
        setBookings(data);
      } catch (error) {
        console.error("Failed to refresh bookings:", error);
      } finally {
        setBookingsLoading(false);
      }
    }
  }, [isAuthenticated, getBookings, setBookings, setBookingsLoading]);

  const handleCreateBooking = async (bookingData: {
    customerId: string;
    propertyCode: string;
    startDate: string;
    price: number;
    source: string;
  }) => {
    await handleModalSubmit(
      async () => {
        const newBooking = await createBooking(bookingData);
        setBookings([...bookings, newBooking]);
        setIsAddModalOpen(false);
      },
      () => setIsAddModalOpen(false)
    );
  };

  const handleEditBooking = async (bookingData: {
    customerId: string;
    propertyCode: string;
    startDate: string;
    price: number;
    source: string;
  }) => {
    if (!editingBooking) return;
    await handleModalSubmit(
      async () => {
        const updatedBooking = await updateBooking(editingBooking.id, bookingData);
        setBookings(bookings.map(b => b.id === editingBooking.id ? updatedBooking : b));
        setEditingBooking(null);
      },
      () => setEditingBooking(null)
    );
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    await handleModalSubmit(
      async () => {
        await deleteBooking(bookingToDelete.id);
        removeBooking(bookingToDelete.id);
        setBookingToDelete(null);
        setIsDeleteModalOpen(false);
      },
      () => {
        setBookingToDelete(null);
        setIsDeleteModalOpen(false);
      }
    );
  };

  useEffect(() => {
    handleRefresh();
    // PRODUCTION UX: Automatically refresh data when user switches back to this tab
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
    };
  }, [handleRefresh]);

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const filteredBookings = useMemo(() => bookings.filter(booking => {
    if (!searchQuery) return true;
    const customer = customerMap.get(booking.customerId);
    const property = propertyMap.get(booking.propertyId);
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      customer?.name.toLowerCase().includes(lowerCaseQuery) ||
      customer?.phone.includes(searchQuery) ||
      (property && property.code.toLowerCase().includes(lowerCaseQuery))
    );
  }), [bookings, searchQuery, customerMap, propertyMap]);

  const TABLE_HEADERS = ['العميل', 'العقار', 'التاريخ', 'السعر', 'المصدر', 'الحالة', 'الإجراءات'];

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="الحجوزات والمواعيد" subtitle="إدارة حجوزات العملاء والمواعيد">
          <ActionButton icon={RefreshCw} label="تحديث" onClick={handleRefresh} variant="secondary" />
          <ActionButton icon={Plus} label="حجز جديد" onClick={() => setIsAddModalOpen(true)} />
        </PageHeader>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في الحجوزات..."
          onFilterClick={() => alert('Filter clicked')}
        />
        <ErrorBoundary>
          {bookingsLoading ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      {TABLE_HEADERS.map((header) => (
                        <th key={header} className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {[...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td className="p-4"><div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-4 w-12 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-5 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-6 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                        <td className="p-4"><div className="h-8 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <DataTable headers={TABLE_HEADERS}>
              {filteredBookings.map((booking) => {
                const customer = customerMap.get(booking.customerId);
                const property = propertyMap.get(booking.propertyId);
                if (!customer || !property) return null;
                return (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</div>
                      <div className="text-sm text-slate-500">{customer.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{property.code}</div>
                      <div className="text-sm text-slate-500">{property.neighborhood}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-900 dark:text-slate-100">
                      {new Date(booking.startDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4 font-semibold text-primary">{booking.price.toLocaleString()} ر.س</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={booking.source} type="icon" />
                        <StatusBadge status={booking.createdBy} />
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={booking.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedBooking(booking)} className="p-2 text-slate-400 hover:text-primary rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button
                          onClick={() => {
                            setEditingBooking(booking);
                            setSelectedBooking(booking);
                          }}
                          className="p-2 text-slate-400 hover:text-primary rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setBookingToDelete(booking);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </ErrorBoundary>
        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="تفاصيل الحجز">
          {selectedBooking && (
            <div>
              <p>العميل: {customerMap.get(selectedBooking.customerId)?.name}</p>
              <p>العقار: {propertyMap.get(selectedBooking.propertyId)?.code}</p>
              <p>السعر: {selectedBooking.price.toLocaleString()} ر.س</p>
            </div>
          )}
        </Modal>
        <BookingModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateBooking}
          title="إنشاء حجز جديد"
          customers={customers}
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <BookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleEditBooking}
          booking={editingBooking}
          title="تعديل الحجز"
          customers={customers}
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBookingToDelete(null);
          }}
          onConfirm={handleDeleteBooking}
          title="حذف الحجز"
          message="هل أنت متأكد من رغبتك في حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء."
          itemName={bookingToDelete ? `${bookingToDelete.propertyId} - ${customerMap.get(bookingToDelete.customerId)?.name || 'عميل غير معروف'}` : undefined}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}