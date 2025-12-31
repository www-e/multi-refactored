'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalFormLayoutProps {
  title: string;
  description?: string; // Added description prop
  children: React.ReactNode;
  error?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
  maxWidth?: 'md' | 'lg' | 'xl';
  destructive?: boolean;
  showSubmitButton?: boolean;
}

export default function ModalFormLayout({
  title,
  description,
  children,
  error,
  isSubmitting = false,
  submitLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  onSubmit,
  onCancel,
  isOpen,
  maxWidth = 'lg',
  destructive = false,
  showSubmitButton
}: ModalFormLayoutProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Default to showing submit button if not specified
  const showSubmitButtonFinal = showSubmitButton !== undefined ? showSubmitButton : true;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className="p-6 space-y-4">
          {children}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
            )}
            {onSubmit && showSubmitButtonFinal && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {isSubmitting ? 'جاري الحفظ...' : submitLabel}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}