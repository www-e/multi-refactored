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
}

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  booking,
  title,
  customers,
  isSubmitting = false,
  error
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