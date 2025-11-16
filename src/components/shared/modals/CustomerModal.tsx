'use client';
import { Customer } from '@/app/(shared)/types';
import { FormField } from './GenericModal';
import GenericModal from './GenericModal';

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
  // Define the form fields configuration
  const customerFields: FormField[] = [
    {
      name: 'name',
      label: 'الاسم الكامل',
      type: 'text',
      required: true,
      placeholder: 'أدخل الاسم الكامل'
    },
    {
      name: 'phone',
      label: 'رقم الهاتف',
      type: 'tel',
      required: true,
      placeholder: '05xxxxxxxx'
    },
    {
      name: 'email',
      label: 'البريد الإلكتروني (اختياري)',
      type: 'email',
      placeholder: 'example@email.com'
    }
  ];

  // Format initial data for the customer
  const initialData = customer ? {
    ...customer
  } : null;

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={title}
      fields={customerFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="md"
    />
  );
}