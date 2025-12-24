'use client';
import { Customer, EnhancedTicket, EnhancedBooking, EnhancedCampaign } from '@/app/(shared)/types';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDate } from '@/lib/utils';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  tickets: EnhancedTicket[];
  bookings: EnhancedBooking[];
  // API functions for CRUD operations
  createTicket?: (data: { customerId: string; category: string; priority: string; project: string; issue: string }) => Promise<any>;
  createBooking?: (data: { customerId: string; propertyCode: string; startDate: string; price: number; source: string }) => Promise<any>;
  updateCustomer?: (id: string, data: { name: string; phone: string; email?: string }) => Promise<any>;
  deleteCustomer?: (id: string) => Promise<any>;
  // State management functions
  addTicket?: (ticket: EnhancedTicket) => void;
  addBooking?: (booking: EnhancedBooking) => void;
  updateCustomerInStore?: (id: string, updates: Partial<Customer>) => void;
  removeCustomerFromStore?: (id: string) => void;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  tickets,
  bookings,
  createTicket,
  createBooking,
  updateCustomer,
  deleteCustomer,
  addTicket,
  addBooking,
  updateCustomerInStore,
  removeCustomerFromStore,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  // Filter related data for this customer
  const customerTickets = tickets.filter(ticket => ticket.customerId === customer.id);
  const customerBookings = bookings.filter(booking => booking.customerId === customer.id);

  // CRUD operation handlers
  const handleAddTicket = async () => {
    if (!customer || !createTicket) return;

    // In a real implementation, this would show a ticket creation form
    try {
      const ticketData = {
        customerId: customer.id,
        category: 'أخرى', // Default
        priority: 'med', // Default
        project: customer.name, // Default
        issue: 'م issue جديد' // Default
      };

      const newTicket = await createTicket(ticketData);
      if (addTicket) {
        addTicket(newTicket);
      }
      // Optionally close and reopen modal to refresh data
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleAddBooking = async () => {
    if (!customer || !createBooking) return;

    // In a real implementation, this would show a booking creation form
    try {
      const bookingData = {
        customerId: customer.id,
        propertyCode: 'DEF-001', // Default
        startDate: new Date().toISOString(), // Default
        price: 0, // Default
        source: 'voice' // Default
      };

      const newBooking = await createBooking(bookingData);
      if (addBooking) {
        addBooking(newBooking);
      }
      // Optionally close and reopen modal to refresh data
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleEditCustomer = async () => {
    if (!customer || !updateCustomer) return;

    // In a real implementation, this would show a customer edit form
    alert(`Would edit customer ${customer.name}`);
  };

  const handleDeleteCustomer = async () => {
    if (!customer || !deleteCustomer) return;

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف العميل "${customer.name}"؟`)) {
      try {
        await deleteCustomer(customer.id);
        if (removeCustomerFromStore) {
          removeCustomerFromStore(customer.id);
        }
        // Optionally close and reopen modal to refresh data
        onClose();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('فشل حذف العميل. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل العميل: ${customer.name}`}>
      <div className="space-y-6">
        {/* Customer Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">معلومات العميل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-slate-500">الاسم</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">الهاتف</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">البريد الإلكتروني</p>
              <p className="font-medium">{customer.email || 'غير متوفر'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">الحالة</p>
              <p className="font-medium">{customer.stage}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">التاريخ</p>
              <p className="font-medium">{formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Related Tickets */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">التذاكر ({customerTickets.length})</h3>
          {customerTickets.length > 0 ? (
            <div className="space-y-2">
              {customerTickets.map(ticket => (
                <div key={ticket.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{ticket.category}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{ticket.issue}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">لا توجد تذاكر</p>
          )}
        </div>

        {/* Related Bookings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">الحجوزات ({customerBookings.length})</h3>
          {customerBookings.length > 0 ? (
            <div className="space-y-2">
              {customerBookings.map(booking => (
                <div key={booking.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">الحجز #{booking.id.substring(0, 8)}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {formatDate(booking.startDate)} - {booking.price} ر.س
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">لا توجد حجوزات</p>
          )}
        </div>

      </div>

      {/* CRUD Operations Section */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddTicket}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={!createTicket}
          >
            إضافة تذكرة
          </button>
          <button
            onClick={handleAddBooking}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={!createBooking}
          >
            إضافة حجز
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleEditCustomer}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-500/90 transition-colors disabled:opacity-50"
            disabled={!updateCustomer}
          >
            تعديل العميل
          </button>
          <button
            onClick={handleDeleteCustomer}
            className="px-3 py-2 bg-destructive text-white rounded-lg text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
            disabled={!deleteCustomer}
          >
            حذف العميل
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </Modal>
  );
}