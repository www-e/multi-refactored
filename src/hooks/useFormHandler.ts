import { useCallback } from 'react';

/**
 * Unified form handler hook
 * Eliminates duplicate form submission patterns across all modals
 */
export const useFormHandler = <T extends Record<string, any>>(
  onSubmit: (data: T) => Promise<any>,
  onSuccess?: () => void
) => {
  const handleFormSubmit = useCallback(async (data: T) => {
    await onSubmit(data);
    onSuccess?.();
  }, [onSubmit, onSuccess]);

  return {
    handleFormSubmit,
  };
};