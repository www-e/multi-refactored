'use client';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Customer } from '@/app/(shared)/types';
import { FormField } from './GenericModal';
import GenericModal from './GenericModal';

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
  // Define the form fields configuration
  const ticketFields: FormField[] = [
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
      name: 'category',
      label: 'الفئة',
      type: 'select',
      required: true,
      options: [
        { value: 'سباكة', label: 'سباكة' },
        { value: 'كهرباء', label: 'كهرباء' },
        { value: 'مفاتيح', label: 'مفاتيح' },
        { value: 'تنظيف', label: 'تنظيف' },
        { value: 'أخرى', label: 'أخرى' }
      ],
      layout: 'half'
    },
    {
      name: 'priority',
      label: 'الأولوية',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'منخفض' },
        { value: 'med', label: 'متوسط' },
        { value: 'high', label: 'عالٍ' },
        { value: 'urgent', label: 'عاجل' }
      ],
      layout: 'half'
    },
    {
      name: 'project',
      label: 'المشروع/العقار',
      type: 'text',
      required: true,
      placeholder: 'e.g., MG13'
    },
    {
      name: 'issue',
      label: 'وصف المشكلة',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: 'وصف تفصيلي للمشكلة...'
    }
  ];

  // Format initial data for the ticket
  const initialData = ticket ? {
    ...ticket
  } : null;

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={title}
      fields={ticketFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="lg"
    />
  );
}