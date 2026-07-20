import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  apiErrors?: Record<string, string[] | string> | null
  errorKey?: string
  errorMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, apiErrors, errorKey, errorMessage, ...props }, ref) => {
    const fieldKey = errorKey ?? props.name ?? props.id
    const backendFieldError =
      fieldKey && apiErrors?.[fieldKey]
        ? Array.isArray(apiErrors[fieldKey])
          ? apiErrors[fieldKey][0]
          : apiErrors[fieldKey]
        : undefined
    const displayedError = errorMessage ?? backendFieldError

    return (
      <div className="w-full">
        <input
          type={type}
          aria-invalid={displayedError ? true : props["aria-invalid"]}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-ring/30",
            displayedError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {displayedError ? (
          <label className="mt-1 block text-xs text-destructive">{displayedError}</label>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
