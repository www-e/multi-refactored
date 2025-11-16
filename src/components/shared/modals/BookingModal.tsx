'use client';
import { useState } from 'react';
import { EnhancedBooking } from '@/app/(shared)/types';
import { Customer } from '@/app/(shared)/types';
import { useFormHandler } from '@/hooks/useFormHandler';
import ModalFormLayout from './ModalFormLayout';

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
  booking?: EnhancedBooking | null;
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
  const [formData, setFormData] = useState({
    customerId: booking?.customerId || '',
    propertyCode: booking?.propertyId || '',
    startDate: booking?.startDate ? new Date(booking.startDate).toISOString().slice(0, 16) : '',
    price: booking?.price || 0,
    source: booking?.source || 'voice'
  });

  const { handleFormSubmit } = useFormHandler(onSubmit, () => {
    if (!booking) { // Only reset form for new bookings
      setFormData({
        customerId: '',
        propertyCode: '',
        startDate: '',
        price: 0,
        source: 'voice'
      });
    }
  });

  const handleSubmit = () => {
    handleFormSubmit({
      ...formData,
      price: Number(formData.price),
      startDate: new Date(formData.startDate).toISOString()
    });
  };

  const submitLabel = booking ? 'تحديث الحجز' : 'إنشاء الحجز';
  const isSubmittingLabel = booking ? 'جاري التحديث...' : 'جاري الإنشاء...';

  return (
    <ModalFormLayout
      title={title}
      isOpen={isOpen}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      onCancel={onClose}
    >
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          العميل *
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>اختر عميل...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} - {c.phone}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          رمز العقار *
        </label>
        <input
          type="text"
          value={formData.propertyCode}
          onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value })}
          required
          placeholder="e.g., MG13"
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          تاريخ ووقت الموعد *
        </label>
        <input
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            السعر (ر.س) *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            المصدر *
          </label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          >
            <option value="voice">مكالمة صوتية</option>
            <option value="chat">محادثة</option>
          </select>
        </div>
      </div>
    </ModalFormLayout>
  );
}