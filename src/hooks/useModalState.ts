import { useState, useCallback } from 'react';

/**
 * Unified modal state management hook
 * Eliminates duplicate state patterns across all modals
 */
export const useModalState = () => {
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalSubmit = useCallback(async (
    operation: () => Promise<any>,
    onSuccess?: () => void
  ) => {
    setModalError('');
    setIsSubmitting(true);
    
    try {
      await operation();
      onSuccess?.();
    } catch (error: any) {
      console.error('Modal operation failed:', error);
      setModalError(error?.detail || error?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetModalState = useCallback(() => {
    setModalError('');
    setIsSubmitting(false);
  }, []);

  return {
    modalError,
    isSubmitting,
    setModalError,
    setIsSubmitting,
    handleModalSubmit,
    resetModalState,
  };
};