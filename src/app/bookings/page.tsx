'use client';
import { useState, useEffect } from 'react';
import {
  Calendar, Plus, CheckCircle, XCircle,
  User, Edit, Eye, Trash2, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Card } from '@/components/shared/ui/Card';
import ActionMenu from '@/components/shared/ui/ActionMenu';
import BookingModal from '@/components/shared/modals/BookingModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { useModalState } from '@/hooks/useModalState';
import { formatDate, formatSAR } from '@/lib/utils';
import ResponsiveTableCard from '@/components/shared/data/ResponsiveTableCard';

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; customerName: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

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
      removeBooking(bookingToDelete.id);
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('فشل حذف الحجز. يرجى المحاولة مرة أخرى.');
    }
  };

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  const getCustomerName = (booking: any) => {
      if (booking.customerName && booking.customerName !== 'Unknown') return booking.customerName;
      const c = getCustomer(booking.customerId);
      return c ? c.name : 'Unknown';
  };

  const getPropertyDisplay = (booking: any) => {
      if (booking.project && booking.project !== 'GENERAL-INQUIRY') return booking.project;
      const p = properties.find(p => p.id === booking.propertyId);
      if (p) return p.code;
      return booking.propertyId || 'General';
  };

  const getBookingById = (id: string) => bookings.find(b => b.id === id);

  const selectedBookingData = selectedBooking ? getBookingById(selectedBooking) : null;

  // Status Matching Helper
  const matchesStatus = (bookingStatus: string, filter: string) => {
    const s = (bookingStatus || '').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'معلق') return s === 'pending' || s === 'معلق';
    if (filter === 'مؤكد') return s === 'confirmed' || s === 'مؤكد';
    if (filter === 'ملغي') return s === 'canceled' || s === 'cancelled' || s === 'ملغي';
    if (filter === 'مكتمل') return s === 'completed' || s === 'مكتمل';
    return s === filter;
  };

  const filteredBookings = bookings.filter(booking => {
    const custName = getCustomerName(booking).toLowerCase();
    const propName = getPropertyDisplay(booking).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || (
      custName.includes(query) ||
      propName.includes(query)
    );

    const isStatusMatch = matchesStatus(booking.status, statusFilter);

    return matchesSearch && isStatusMatch;
  });

  const isPending = (status: string) => ['pending', 'معلق'].includes(status.toLowerCase());

  // Also fix pending filter for the "Needs Approval" cards
  const pendingBookings = bookings.filter(b =>
    isPending(b.status) &&
    (statusFilter === 'all' || matchesStatus(b.status, statusFilter))
  );

  const handleAction = async (id: string, action: 'confirmed' | 'canceled') => {
    // Map English action to Arabic status for API and storage
    const statusMap = {
      confirmed: 'مؤكد' as const,
      canceled: 'ملغي' as const
    };
    const arabicStatus = statusMap[action];

    await updateBookingStatusWithMapping(id, arabicStatus);
    updateBookingInStore(id, { status: arabicStatus }); // Optimistic update with Arabic value
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

        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-1 border border-white/20 dark:border-slate-700/20">
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400'}`}>جدول</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400'}`}>تقويم</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="البحث في الحجوزات..." onFilterClick={() => {}} />
          <div className="flex flex-wrap gap-2">
            {['all', 'معلق', 'مؤكد', 'ملغي', 'مكتمل'].map(status => (
                <button
                  key={status}
                  className={`px-3 py-2 rounded-lg text-sm ${statusFilter === status ? 'bg-primary text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'الكل' : status}
                </button>
            ))}
          </div>
        </div>

        {/* Button to open pending approvals modal */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsApprovalModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span>طلبات في انتظار الموافقة ({pendingBookings.length})</span>
            </button>
          </div>
        )}

        {viewMode === 'table' ? (
            <Card className="p-0 overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                    {filteredBookings.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">لا توجد حجوزات لعرضها</div>
                    ) : (
                        filteredBookings.map((booking, index) => {
                            const customerName = getCustomerName(booking);
                            const propDisplay = getPropertyDisplay(booking);

                            // Prepare booking data for the card component
                            const bookingData = {
                                ...booking,
                                type: 'booking' as const,
                                customerName: customerName,
                                project: propDisplay
                            };

                            return (
                                <ResponsiveTableCard
                                    key={booking.id}
                                    item={bookingData}
                                    actions={[
                                        {
                                            label: 'عرض التفاصيل',
                                            icon: <Eye size={16} />,
                                            onClick: () => setSelectedBooking(booking.id),
                                            color: 'text-slate-600 dark:text-slate-400'
                                        },
                                        {
                                            label: 'تعديل',
                                            icon: <Edit size={16} />,
                                            onClick: () => handleEditBooking(booking),
                                            color: 'text-slate-600 dark:text-slate-400'
                                        },
                                        {
                                            label: 'حذف',
                                            icon: <Trash2 size={16} />,
                                            onClick: () => handleDeleteBooking({id: booking.id, customerName: customerName}),
                                            color: 'text-destructive'
                                        }
                                    ]}
                                    onCardClick={() => setSelectedBooking(booking.id)}
                                    customers={customers}
                                    properties={properties}
                                />
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 w-12 text-center font-semibold text-slate-900 dark:text-slate-100">#</th>
                                <th className="text-right p-4">العميل</th>
                                <th className="text-right p-4">العقار/المشروع</th>
                                <th className="text-right p-4">موعد الحجز</th>
                                <th className="text-right p-4">تاريخ الإنشاء</th>
                                <th className="text-right p-4">السعر</th>
                                <th className="text-right p-4">المصدر</th>
                                <th className="text-right p-4">الحالة</th>
                                <th className="text-right p-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredBookings.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا توجد حجوزات لعرضها</td></tr>
                            )}
                            {filteredBookings.map((booking, index) => {
                                const customerName = getCustomerName(booking);
                                const propDisplay = getPropertyDisplay(booking);
                                return (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary"><User size={16}/></div>
                                                <div>
                                                    <p className="font-medium">{customerName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{propDisplay}</p>
                                        </td>
                                        <td className="p-4 text-sm">{formatDate(booking.startDate)}</td>
                                        <td className="p-4 text-sm">{formatDate(booking.createdAt)}</td>
                                        <td className="p-4 font-semibold text-primary">{formatSAR(booking.price || 0)}</td>
                                        <td className="p-4"><StatusBadge status={booking.source} type="icon"/></td>
                                        <td className="p-4"><StatusBadge status={booking.status} /></td>
                                        <td className="p-4">
                                            <ActionMenu
                                                actions={[
                                                    {
                                                        label: 'عرض التفاصيل',
                                                        icon: <Eye size={16} />,
                                                        onClick: () => setSelectedBooking(booking.id),
                                                        color: 'text-slate-600 dark:text-slate-400'
                                                    },
                                                    {
                                                        label: 'تعديل',
                                                        icon: <Edit size={16} />,
                                                        onClick: () => handleEditBooking(booking),
                                                        color: 'text-slate-600 dark:text-slate-400'
                                                    },
                                                    {
                                                        label: 'حذف',
                                                        icon: <Trash2 size={16} />,
                                                        onClick: () => handleDeleteBooking({id: booking.id, customerName: customerName}),
                                                        color: 'text-destructive'
                                                    }
                                                ]}
                                            />
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

        {/* Booking Detail Modal */}
        <BookingModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            title="عرض تفاصيل الحجز"
            booking={selectedBookingData}
            customers={customers}
            viewMode={true}
            onSubmit={async () => {}} // Not used in view mode
            isSubmitting={false}
        />

        {/* Approval Modal */}
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${isApprovalModalOpen ? '' : 'hidden'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                طلبات في انتظار الموافقة ({pendingBookings.length})
              </h3>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {pendingBookings.map(booking => {
                  const customerName = getCustomerName(booking);
                  const propDisplay = getPropertyDisplay(booking);
                  return (
                    <Card key={booking.id} className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                          <StatusBadge status={booking.createdBy} />
                          <span className="text-xs text-slate-500">{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                          <h4 className="font-semibold">{customerName}</h4>
                          <p className="text-sm text-slate-600">{propDisplay}</p>
                          <div className="text-sm space-y-1">
                              <p className="text-slate-600">موعد الحجز: {formatDate(booking.startDate)}</p>
                              <p className="text-slate-600">تاريخ الإنشاء: {formatDate(booking.createdAt)}</p>
                          </div>
                          <p className="text-lg font-bold text-primary">{formatSAR(booking.price || 0)}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <button onClick={() => {
                            handleAction(booking.id, 'confirmed');
                            // Close modal if no more pending bookings
                            if (pendingBookings.length <= 1) {
                              setIsApprovalModalOpen(false);
                            }
                          }} className="flex-1 bg-success text-white p-2 rounded-lg hover:bg-success/90 text-sm flex items-center justify-center gap-2"><CheckCircle size={16}/> موافقة</button>
                          <button onClick={() => {
                            handleAction(booking.id, 'canceled');
                            // Close modal if no more pending bookings
                            if (pendingBookings.length <= 1) {
                              setIsApprovalModalOpen(false);
                            }
                          }} className="flex-1 bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90 text-sm flex items-center justify-center gap-2"><XCircle size={16}/> رفض</button>
                      </div>
                    </Card>
                  );
                })}
                {pendingBookings.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    لا توجد طلبات في انتظار الموافقة
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}