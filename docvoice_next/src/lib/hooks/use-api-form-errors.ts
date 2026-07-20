"use client";

import { useState, useCallback } from "react";
import { UseFormSetError, UseFormClearErrors } from "react-hook-form";
import { ApiError } from "@/lib/api/api-error";

interface UseApiFormErrorsOptions {
  setError: UseFormSetError<any>;
  clearErrors: UseFormClearErrors<any>;
  fieldMapping?: Record<string, string>;
}

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export function useApiFormErrors({ setError, clearErrors, fieldMapping = {} }: UseApiFormErrorsOptions) {
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);

  const getMappedField = (apiField: string): string => {
    if (fieldMapping[apiField]) {
      return fieldMapping[apiField];
    }
    return apiField;
  };

  const handleApiErrors = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      const message = error.message || 'حدث خطأ غير متوقع';
      setApiMessage(message);
      setHasApiError(true);

      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.entries(error.errors).forEach(([apiField, messages]) => {
          const formField = getMappedField(apiField);
          if (messages && messages.length > 0) {
            setError(formField as any, {
              type: "server",
              message: messages[0],
            });
          }
        });
      }

      return true;
    }

    if (error && typeof error === "object") {
      const err = error as any;
      const responseData = err.response?.data;
      
      let message = 'حدث خطأ غير متوقع';
      let errors: Record<string, string[]> = {};
      
      if (responseData && typeof responseData === 'object') {
        message = responseData.message || err.message || 'حدث خطأ غير متوقع';
        errors = responseData.errors || {};
      } else if (err.message) {
        message = err.message;
      }
      
      setApiMessage(message);
      setHasApiError(true);

      if (errors && Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([apiField, messages]) => {
          const formField = getMappedField(apiField);
          if (messages && Array.isArray(messages) && messages.length > 0) {
            setError(formField as any, {
              type: "server",
              message: messages[0],
            });
          }
        });
      }

      return true;
    }

    if (typeof error === "string") {
      setApiMessage(error);
      setHasApiError(true);
      return true;
    }

    setApiMessage('حدث خطأ غير متوقع');
    setHasApiError(true);
    return false;
  }, [setError, fieldMapping]);

  const clearApiErrors = useCallback(() => {
    setApiMessage(null);
    setHasApiError(false);
    clearErrors();
  }, [clearErrors]);

  const resetApiState = useCallback(() => {
    setApiMessage(null);
    setHasApiError(false);
  }, []);

  return {
    apiMessage,
    hasApiError,
    handleApiErrors,
    clearApiErrors,
    resetApiState,
  };
}

export default useApiFormErrors;
