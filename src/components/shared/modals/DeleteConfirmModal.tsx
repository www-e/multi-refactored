'use client';
import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  isSubmitting?: boolean;
  destructive?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isSubmitting = false,
  destructive = true
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (itemName && confirmText !== itemName) {
      return; // Don't proceed if confirmation text doesn't match
    }
    await onConfirm();
    setConfirmText('');
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {destructive && (
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">العنصر المراد حذفه:</div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{itemName}</div>
            </div>
          )}

          {itemName && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                اكتب "<span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{itemName}</span>" للتأكيد:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={itemName}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || Boolean(itemName && confirmText !== itemName)}
              className={destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {isSubmitting ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}