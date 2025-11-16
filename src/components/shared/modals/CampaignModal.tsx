'use client';
import { EnhancedCampaign } from '@/app/(shared)/types';
import { FormField } from './GenericModal';
import GenericModal from './GenericModal';

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
  // Define the form fields configuration
  const campaignFields: FormField[] = [
    {
      name: 'name',
      label: 'اسم الحملة',
      type: 'text',
      required: true,
      placeholder: 'e.g., حملة الحجوزات الربيعية'
    },
    {
      name: 'type',
      label: 'النوع',
      type: 'select',
      required: true,
      options: [
        { value: 'voice', label: 'صوتية' },
        { value: 'chat', label: 'رسائل' }
      ],
      layout: 'half'
    },
    {
      name: 'objective',
      label: 'الهدف',
      type: 'select',
      required: true,
      options: [
        { value: 'bookings', label: 'حجوزات' },
        { value: 'renewals', label: 'تجديدات' },
        { value: 'leadgen', label: 'تحصيل عملاء' },
        { value: 'upsell', label: 'بيع إضافي' }
      ],
      layout: 'half'
    },
    {
      name: 'audienceQuery',
      label: 'معايير الجمهور المستهدف',
      type: 'textarea',
      rows: 4,
      placeholder: '{"status": "new"}',
      className: 'text-xs font-mono'
    }
  ];

  // Format initial data for the campaign
  const initialData = campaign ? {
    ...campaign,
    audienceQuery: JSON.stringify(campaign.audienceQuery, null, 2) // Convert JSON to string for the textarea
  } : null;

  const handleSubmit = async (formData: any) => {
    // Convert audienceQuery back from JSON string to object if it's a valid JSON
    const processedData = {
      ...formData,
      audienceQuery: typeof formData.audienceQuery === 'string'
        ? JSON.parse(formData.audienceQuery || '{"status": "new"}')
        : formData.audienceQuery
    };
    await onSubmit(processedData);
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      fields={campaignFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="md"
    >
      <p className="text-xs text-slate-500 mt-1">
        تنسيق JSON: معايير تصفية الجمهور المستهدف
      </p>
    </GenericModal>
  );
}