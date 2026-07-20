import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Combobox } from "@/components/ui/combobox"

export interface FormComboboxProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  hideLabel?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  options: { label: string; value: string; icon?: React.ReactNode }[]
  className?: string
}

const FormCombobox = React.forwardRef<HTMLButtonElement, FormComboboxProps>(
  ({ control, name, label, hideLabel, placeholder, searchPlaceholder, emptyPlaceholder, options, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            {!hideLabel && <FormLabel>{label || name}</FormLabel>}
            <FormControl>
              <Combobox
                options={options}
                value={field.value}
                onChange={field.onChange}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyPlaceholder={emptyPlaceholder}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
)
FormCombobox.displayName = "FormCombobox"

export { FormCombobox }
