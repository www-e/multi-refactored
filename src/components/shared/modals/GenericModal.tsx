'use client';
import { useState } from 'react';
import { useFormHandler } from '@/hooks/useFormHandler';
import ModalFormLayout from './ModalFormLayout';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'datetime-local' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select fields
  rows?: number; // For textarea fields
  step?: string | number; // For number inputs
  min?: string | number; // For number inputs
  className?: string;
  defaultValue?: any;
  layout?: 'full' | 'half' | 'third'; // For grid layouts
}

export interface GenericModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: Partial<T> | null;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string;
  maxWidth?: 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  onFormChange?: (formData: any) => void;
}

export default function GenericModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData = null,
  submitLabel = 'حفظ',
  isSubmitting = false,
  error,
  maxWidth = 'lg',
  children,
  onFormChange
}: GenericModalProps<T>) {
  // Initialize form data based on fields and initialData
  const initializeFormData = () => {
    const formData: Record<string, any> = {};
    fields.forEach(field => {
      const value = initialData?.[field.name as keyof T];
      formData[field.name] = value !== undefined ? value : field.defaultValue || '';
    });
    return formData;
  };

  const [formData, setFormData] = useState<Record<string, any>>(initializeFormData);

  // Create a version of onSubmit that works with Record<string, any>
  const handleSubmitForm = async (data: Record<string, any>) => {
    return onSubmit(data as T);
  };

  const { handleFormSubmit } = useFormHandler(handleSubmitForm, () => {
    if (!initialData) { // Only reset form for new items
      setFormData(initializeFormData());
    }
  });

  // Update form data when initialData changes
  useState(() => {
    if (initialData) {
      setFormData(initializeFormData());
    }
  });

  const handleSubmit = () => {
    handleFormSubmit(formData);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    onFormChange?.(newFormData);
  };

  // Dynamic form field renderer based on field type
  const renderField = (field: FormField) => {
    const commonProps = {
      className: `w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-primary ${field.className || ''}`,
      value: formData[field.name] || '',
      required: field.required
    };

    switch (field.type) {
      case 'select':
        return (
          <select
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            {field.required && !field.defaultValue && <option value="" disabled>اختر {field.label}...</option>}
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      default: // text, email, tel, number, datetime-local
        return (
          <input
            {...commonProps}
            type={field.type}
            step={field.type === 'number' ? field.step : undefined}
            min={field.type === 'number' ? field.min : undefined}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const currentSubmitLabel = initialData ? `تحديث ${title}` : `إنشاء ${title}`;
  const currentIsSubmittingLabel = initialData ? 'جاري التحديث...' : 'جاري الإنشاء...';

  return (
    <ModalFormLayout
      title={title}
      isOpen={isOpen}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={currentSubmitLabel}
      onSubmit={handleSubmit}
      onCancel={onClose}
      maxWidth={maxWidth}
    >
      {/* Group fields based on layout */}
      {(() => {
        const fullFields = fields.filter(f => f.layout !== 'half' && f.layout !== 'third');
        const halfFields = fields.filter(f => f.layout === 'half');
        const thirdFields = fields.filter(f => f.layout === 'third');

        const elements = [];

        // Add full width fields
        for (const field of fullFields) {
          elements.push(
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                {field.label} {field.required && '*'}
              </label>
              {renderField(field)}
            </div>
          );
        }

        // Add half width fields in pairs
        if (halfFields.length > 0) {
          for (let i = 0; i < halfFields.length; i += 2) {
            const pair = halfFields.slice(i, i + 2);
            elements.push(
              <div key={`half-group-${i}`} className="grid grid-cols-2 gap-4">
                {pair.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            );
          }
        }

        // Add third width fields in triplets
        if (thirdFields.length > 0) {
          for (let i = 0; i < thirdFields.length; i += 3) {
            const triplet = thirdFields.slice(i, i + 3);
            elements.push(
              <div key={`third-group-${i}`} className="grid grid-cols-3 gap-4">
                {triplet.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            );
          }
        }

        return elements;
      })()}

      {children}
    </ModalFormLayout>
  );
}