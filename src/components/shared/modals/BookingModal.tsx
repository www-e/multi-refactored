'use client';
import { Customer } from '@/app/(shared)/types';
import { FormField } from './GenericModal';
import GenericModal from './GenericModal';
import { mapChannelTypeToEnglish } from '@/lib/statusMapper';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    propertyCode: string;
    startDate: string;
    price: number;
    source: string;
  }) => Promise<void>;
  booking?: any | null; // EnhancedBooking type
  title: string;
  customers: Customer[];
  isSubmitting?: boolean;
  error?: string;
  viewMode?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  booking,
  title,
  customers,
  isSubmitting = false,
  error,
  viewMode = false
}: BookingModalProps) {
  // Define the form fields configuration
  const bookingFields: FormField[] = [
    {
      name: 'customerId',
      label: 'العميل',
      type: 'select',
      required: true,
      options: customers.map(c => ({
        value: c.id,
        label: `${c.name} - ${c.phone}`
      }))
    },
    {
      name: 'propertyCode',
      label: 'رمز العقار',
      type: 'text',
      required: true,
      placeholder: 'e.g., MG13'
    },
    {
      name: 'startDate',
      label: 'تاريخ ووقت الموعد',
      type: 'datetime-local',
      required: true
    },
    {
      name: 'price',
      label: 'السعر (ر.س)',
      type: 'number',
      required: true,
      min: '0',
      step: '0.01',
      placeholder: '0.00',
      layout: 'half'
    },
    {
      name: 'source',
      label: 'المصدر',
      type: 'select',
      required: true,
      options: [
        { value: 'voice', label: 'مكالمة صوتية' },
        { value: 'chat', label: 'محادثة' }
      ],
      layout: 'half'
    }
  ];

  // For view mode, show the booking details in read-only format
  if (viewMode && booking) {
    const customer = customers.find(c => c.id === booking.customerId);
    const customerName = customer ? `${customer.name} - ${customer.phone}` : booking.customerName || 'Unknown';

    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={async () => {}} // Empty function for view mode
        title={title}
        fields={[]}
        initialData={null}
        isSubmitting={false}
        error={error}
        maxWidth="lg"
        viewMode={true}
        customContent={
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العميل</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {customerName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رمز العقار</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {booking.propertyId || booking.propertyCode || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ ووقت الحجز</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {new Date(booking.startDate).toLocaleString('ar-SA')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">السعر</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {booking.price} ر.س
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المصدر</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {booking.source === 'voice' ? 'مكالمة صوتية' :
                   booking.source === 'chat' ? 'محادثة' :
                   booking.source}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الحالة</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {booking.status}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الإنشاء</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {new Date(booking.createdAt).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // Format initial data for the booking
  const initialData = booking ? {
    ...booking,
    startDate: booking.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : '',
    propertyCode: booking.propertyId || booking.propertyCode || ''
  } : null;

  const handleSubmit = async (formData: any) => {
    const processedData = {
      ...formData,
      source: mapChannelTypeToEnglish(formData.source), // Map Arabic to English for API
      price: Number(formData.price),
      startDate: new Date(formData.startDate).toISOString()
    };
    await onSubmit(processedData);
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      fields={bookingFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="lg"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* This will render the price and source fields in a grid */}
        {/* The grid is handled by the generic modal when needed */}
      </div>
    </GenericModal>
  );
}