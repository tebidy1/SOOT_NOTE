import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

export interface FormTextareaProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  hideLabel?: boolean
  className?: string
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ control, name, label, hideLabel, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            {!hideLabel && <FormLabel>{label || name}</FormLabel>}
            <FormControl>
              <Textarea
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
FormTextarea.displayName = "FormTextarea"

export { FormTextarea }
