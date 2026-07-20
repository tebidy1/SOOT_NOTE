"use client";

import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormApiErrorProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function FormApiError({ message, onDismiss, className }: FormApiErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className={cn("mb-6", className)}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>خطأ</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default FormApiError;
