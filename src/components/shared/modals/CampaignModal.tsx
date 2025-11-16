'use client';
import { useState } from 'react';
import { EnhancedCampaign } from '@/app/(shared)/types';
import { useFormHandler } from '@/hooks/useFormHandler';
import ModalFormLayout from './ModalFormLayout';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    objective: string;
    audienceQuery?: any;
  }) => Promise<void>;
  campaign?: EnhancedCampaign | null;
  title: string;
  isSubmitting?: boolean;
  error?: string;
}

export default function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
  campaign,
  title,
  isSubmitting = false,
  error
}: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'voice',
    objective: campaign?.objective || 'bookings',
    audienceQuery: campaign?.audienceQuery || { status: "new" }
  });

  const { handleFormSubmit } = useFormHandler(onSubmit, () => {
    if (!campaign) { // Only reset form for new campaigns
      setFormData({
        name: '',
        type: 'voice',
        objective: 'bookings',
        audienceQuery: { status: "new" }
      });
    }
  });

  const handleSubmit = () => {
    handleFormSubmit(formData);
  };

  const submitLabel = campaign ? 'تحديث الحملة' : 'إنشاء الحملة';
  const isSubmittingLabel = campaign ? 'جاري التحديث...' : 'جاري الإنشاء...';

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
          اسم الحملة *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., حملة الحجوزات الربيعية"
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            النوع *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          >
            <option value="voice">صوتية</option>
            <option value="chat">رسائل</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            الهدف *
          </label>
          <select
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            required
            className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary"
          >
            <option value="bookings">حجوزات</option>
            <option value="renewals">تجديدات</option>
            <option value="leadgen">تحصيل عملاء</option>
            <option value="upsell">بيع إضافي</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          معايير الجمهور المستهدف
        </label>
        <textarea
          value={JSON.stringify(formData.audienceQuery, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setFormData({ ...formData, audienceQuery: parsed });
            } catch {
              // Ignore invalid JSON while typing
            }
          }}
          rows={4}
          className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary text-xs font-mono"
          placeholder='{"status": "new"}'
        />
        <p className="text-xs text-slate-500 mt-1">
          تنسيق JSON: معايير تصفية الجمهور المستهدف
        </p>
      </div>
    </ModalFormLayout>
  );
}