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

  // Custom validation function to validate email format before submission
  const validateEmail = (email: string | undefined): string | null => {
    if (!email) return null; // Allow undefined/null emails

    // Simple but effective email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'الرجاء إدخال بريد إلكتروني صحيح';
    }
    return null;
  };

  // Override the onSubmit to include email validation
  const handleSubmit = async (data: { name: string; phone: string; email?: string }) => {
    // Validate email format before submitting
    const emailError = validateEmail(data.email);
    if (emailError) {
      // This will be handled by the parent component's error handling
      throw new Error(emailError);
    }

    // If email is empty string, convert to undefined to avoid backend validation issues
    const processedData = {
      ...data,
      email: data.email?.trim() || undefined
    };

    await onSubmit(processedData);
  };

  // Format initial data for the customer
  const initialData = customer ? {
    ...customer
  } : null;

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      fields={customerFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="md"
    />
  );
}