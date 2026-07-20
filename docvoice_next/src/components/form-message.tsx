import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormMessageProps {
  variant: "error" | "success";
  title?: string;
  message: string;
}

export function FormMessage({ variant, title, message }: FormMessageProps) {
  const isError = variant === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className={cn(
      "flex items-start space-x-3 rtl:space-x-reverse rounded-lg border p-4",
      isError 
        ? "bg-destructive/10 border-destructive/20 text-destructive" 
        : "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold">{title}</h5>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
