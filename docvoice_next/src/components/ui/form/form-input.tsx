import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input, InputProps } from "@/components/ui/input"

export interface FormInputProps<T extends FieldValues = any> extends Omit<InputProps, 'name' | 'control'> {
  control: Control<T>
  name: Path<T>
  label?: string
  hideLabel?: boolean
  className?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ control, name, label, hideLabel, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            {!hideLabel && <FormLabel>{label || name}</FormLabel>}
            <FormControl>
              <Input
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
FormInput.displayName = "FormInput"

export { FormInput }
