'use client';

import { useState, useCallback, ReactNode } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { ApiError } from '@/lib/api/api-error';
import { FormApiError } from '@/components/ui/form-api-error';
import { showError, showSuccess } from '@/lib/services/notification.service';

interface ApiFormProps {
  children: ReactNode | ((form: UseFormReturn<any>) => ReactNode);
  defaultValues?: Record<string, any>;
  resolver?: any;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  className?: string;
  successMessage?: string;
}

export function ApiForm({
  children,
  defaultValues,
  resolver,
  onSubmit,
  className,
  successMessage,
}: ApiFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    resolver,
  });

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    let errorMessage = 'حدث خطأ غير متوقع';
    
    if (error instanceof ApiError) {
      if (error.hasValidationMessage()) {
        errorMessage = error.getValidationMessage() || error.message;
        setApiError(errorMessage);
      } else if (error.isValidationError() && Object.keys(error.errors).length > 0) {
        const firstErrorKey = Object.keys(error.errors)[0];
        const firstError = error.errors[firstErrorKey]?.[0];
        errorMessage = firstError || error.message;
        setApiError(errorMessage);
      } else {
        errorMessage = error.message;
        setApiError(errorMessage);
      }

      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            form.setError(field as any, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      setApiError(errorMessage);
    } else {
      setApiError(errorMessage);
    }
    
    showError(errorMessage);
  }, [form]);

  const handleSubmit = useCallback(async (data: Record<string, any>) => {
    clearApiError();
    try {
      await onSubmit(data);
      if (successMessage) {
        showSuccess(successMessage);
      }
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, [onSubmit, clearApiError, handleApiError, successMessage]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <FormApiError message={apiError} onDismiss={clearApiError} />
        {typeof children === 'function' ? children(form) : children}
      </form>
    </FormProvider>
  );
}

export function useApiForm(options?: {
  defaultValues?: Record<string, any>;
  resolver?: any;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: options?.defaultValues,
    resolver: options?.resolver,
  });

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    let errorMessage = 'حدث خطأ غير متوقع';
    
    if (error instanceof ApiError) {
      if (error.hasValidationMessage()) {
        errorMessage = error.getValidationMessage() || error.message;
        setApiError(errorMessage);
      } else if (error.isValidationError() && Object.keys(error.errors).length > 0) {
        const firstErrorKey = Object.keys(error.errors)[0];
        const firstError = error.errors[firstErrorKey]?.[0];
        errorMessage = firstError || error.message;
        setApiError(errorMessage);
      } else {
        errorMessage = error.message;
        setApiError(errorMessage);
      }

      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            form.setError(field as any, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      setApiError(errorMessage);
    } else {
      setApiError(errorMessage);
    }
    
    showError(errorMessage);
  }, [form]);

  return {
    form,
    apiError,
    clearApiError,
    handleApiError,
  };
}

export default ApiForm;
