'use client';
import { useState } from 'react';
import { Customer } from '@/app/(shared)/types';
import { useFormHandler } from '@/hooks/useFormHandler';
import ModalFormLayout from './ModalFormLayout';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; email?: string }) => Promise<void>;
  customer?: Customer | null;
  title: string;
  customers: Customer[];
  isSubmitting?: boolean;
  error?: string;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  title,
  customers,
  isSubmitting = false,
  error
}: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || ''
  });

  const { handleFormSubmit } = useFormHandler(onSubmit, () => {
    if (!customer) { // Only reset form for new customers
      setFormData({ name: '', phone: '', email: '' });
    }
  });

  const handleSubmit = () => {
    handleFormSubmit(formData);
  };

  const submitLabel = customer ? 'تحديث العميل' : 'إنشاء العميل';
  const isSubmittingLabel = customer ? 'جاري التحديث...' : 'جاري الإنشاء...';

  return (
    <ModalFormLayout
      title={title}
      isOpen={isOpen}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      onCancel={onClose}
      maxWidth="md"
    >
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          الاسم الكامل *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          placeholder="أدخل الاسم الكامل"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          رقم الهاتف *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          placeholder="05xxxxxxxx"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          البريد الإلكتروني (اختياري)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          placeholder="example@email.com"
        />
      </div>
    </ModalFormLayout>
  );
}