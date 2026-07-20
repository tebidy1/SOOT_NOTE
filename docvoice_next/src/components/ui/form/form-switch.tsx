import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"

export interface FormSwitchProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  className?: string
}

const FormSwitch = React.forwardRef<HTMLButtonElement, FormSwitchProps>(
  ({ control, name, label, className, ...props }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            <div className="flex items-center justify-between">
              {label && (
                <FormLabel className="cursor-pointer">
                  {label}
                </FormLabel>
              )}
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
)
FormSwitch.displayName = "FormSwitch"

export { FormSwitch }
