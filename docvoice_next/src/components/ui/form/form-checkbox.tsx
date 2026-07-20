import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

export interface FormCheckboxProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  className?: string
}

const FormCheckbox = React.forwardRef<HTMLButtonElement, FormCheckboxProps>(
  ({ control, name, label, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            <div className="flex flex-row items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              {label && (
                <FormLabel className="font-normal cursor-pointer">
                  {label}
                </FormLabel>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
)
FormCheckbox.displayName = "FormCheckbox"

export { FormCheckbox }
