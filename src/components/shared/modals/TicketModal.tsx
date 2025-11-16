'use client';
import { useState } from 'react';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Customer } from '@/app/(shared)/types';
import { useFormHandler } from '@/hooks/useFormHandler';
import ModalFormLayout from './ModalFormLayout';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    category: string;
    priority: string;
    project: string;
    issue: string;
  }) => Promise<void>;
  ticket?: EnhancedTicket | null;
  title: string;
  customers: Customer[];
  isSubmitting?: boolean;
  error?: string;
}

export default function TicketModal({
  isOpen,
  onClose,
  onSubmit,
  ticket,
  title,
  customers,
  isSubmitting = false,
  error
}: TicketModalProps) {
  const [formData, setFormData] = useState({
    customerId: ticket?.customerId || '',
    category: ticket?.category || 'سباكة',
    priority: ticket?.priority || 'med',
    project: ticket?.project || '',
    issue: ticket?.issue || ''
  });

  const { handleFormSubmit } = useFormHandler(onSubmit, () => {
    if (!ticket) { // Only reset form for new tickets
      setFormData({
        customerId: '',
        category: 'سباكة',
        priority: 'med',
        project: '',
        issue: ''
      });
    }
  });

  const handleSubmit = () => {
    handleFormSubmit(formData);
  };

  const submitLabel = ticket ? 'تحديث التذكرة' : 'إنشاء التذكرة';
  const isSubmittingLabel = ticket ? 'جاري التحديث...' : 'جاري الإنشاء...';

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            الفئة *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          >
            <option value="سباكة">سباكة</option>
            <option value="كهرباء">كهرباء</option>
            <option value="مفاتيح">مفاتيح</option>
            <option value="تنظيف">تنظيف</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            الأولوية *
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'med' | 'high' | 'urgent' })}
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          >
            <option value="low">منخفض</option>
            <option value="med">متوسط</option>
            <option value="high">عالٍ</option>
            <option value="urgent">عاجل</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          المشروع/العقار *
        </label>
        <input
          type="text"
          value={formData.project}
          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
          required
          placeholder="e.g., MG13"
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          وصف المشكلة *
        </label>
        <textarea
          value={formData.issue}
          onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
          required
          rows={3}
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          placeholder="وصف تفصيلي للمشكلة..."
        />
      </div>
    </ModalFormLayout>
  );
}