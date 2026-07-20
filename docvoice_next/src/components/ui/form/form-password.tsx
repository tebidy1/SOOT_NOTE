import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/components/ui/password-input"

export interface FormPasswordProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  hideLabel?: boolean
  className?: string
}

const FormPassword = React.forwardRef<HTMLInputElement, FormPasswordProps>(
  ({ control, name, label, hideLabel, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            {!hideLabel && <FormLabel>{label || name}</FormLabel>}
            <FormControl>
              <PasswordInput
                {...field}
                ref={ref}
                {...props}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
)
FormPassword.displayName = "FormPassword"

export { FormPassword }
