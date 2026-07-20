"use client"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import * as React from "react"
import { Control, FieldValues, Path } from "react-hook-form"
import Select, { GroupBase, MultiValue, OnChangeValue, SingleValue, StylesConfig } from "react-select"
import AsyncSelect from "react-select/async"
import CreatableSelect from "react-select/creatable"

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}

export interface FormSelectProps<T extends FieldValues = any> {
  control: Control<T>
  name: Path<T>
  label?: string
  hideLabel?: boolean
  placeholder?: string
  options: SelectOption[]
  className?: string
  isMulti?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  isAsync?: boolean
  isCreatable?: boolean
  loadOptions?: (inputValue: string) => Promise<SelectOption[]> | SelectOption[]
  defaultOptions?: boolean | SelectOption[]
  cacheOptions?: boolean
  noOptionsMessage?: string
  loadingMessage?: string
  formatCreateLabel?: (inputValue: string) => React.ReactNode
  onCreateOption?: (inputValue: string) => void
  menuPlacement?: "auto" | "bottom" | "top"
  maxMenuHeight?: number
  closeMenuOnSelect?: boolean
  hideSelectedOptions?: boolean
}

const customStyles: StylesConfig<SelectOption, boolean> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    borderRadius: "var(--radius)",
    boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--ring))" : "none",
    minHeight: "2.5rem",
    "&:hover": {
      borderColor: "hsl(var(--ring))",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "transparent",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? 0.5 : 1,
    padding: "0.5rem 0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--secondary))",
    borderRadius: "var(--radius)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "hsl(var(--secondary-foreground))",
    padding: "0.125rem 0.375rem",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "hsl(var(--secondary-foreground))",
    borderRadius: "0 var(--radius) var(--radius) 0",
    "&:hover": {
      backgroundColor: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--destructive))",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  loadingMessage: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
}

const OptionWithIcon = (props: { icon?: React.ReactNode; label: string }) => (
  <>
    {props.icon}
    <span>{props.label}</span>
  </>
)

const FormSelect = React.forwardRef<any, FormSelectProps>(
  (
    {
      control,
      name,
      label,
      hideLabel,
      placeholder = "اختر...",
      options,
      className,
      isMulti = false,
      isClearable = true,
      isSearchable = true,
      isDisabled = false,
      isLoading = false,
      isAsync = false,
      isCreatable = false,
      loadOptions,
      defaultOptions = false,
      cacheOptions = false,
      noOptionsMessage = "لا توجد خيارات",
      loadingMessage = "جاري التحميل...",
      formatCreateLabel,
      onCreateOption,
      menuPlacement = "auto",
      maxMenuHeight = 200,
      closeMenuOnSelect = !isMulti,
      hideSelectedOptions = false,
    },
    ref
  ) => {
    const formatOptionLabel = (option: SelectOption) => (
      <OptionWithIcon icon={option.icon} label={option.label} />
    )

    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => {
          const handleChange = (
            newValue: OnChangeValue<SelectOption, boolean>
          ) => {
            if (isMulti) {
              const multiValue = newValue as MultiValue<SelectOption>
              field.onChange(multiValue.map((item) => item.value))
            } else {
              const singleValue = newValue as SingleValue<SelectOption>
              field.onChange(singleValue?.value ?? null)
            }
          }

          const getValue = () => {
            if (isMulti) {
              const values = (field.value || []) as (string | number)[]
              return options.filter((opt) => values.includes(opt.value))
            } else {
              return (
                options.find((opt) => opt.value === field.value) || null
              )
            }
          }

          const isOptionDisabled = (option: SelectOption) =>
            !!option.disabled

          const commonProps = {
            ref,
            inputId: name,
            placeholder,
            isMulti,
            isClearable,
            isSearchable,
            isDisabled: isDisabled || field.disabled,
            isLoading,
            isOptionDisabled,
            menuPlacement,
            maxMenuHeight,
            closeMenuOnSelect,
            hideSelectedOptions,
            styles: customStyles,
            formatOptionLabel,
            noOptionsMessage: () => noOptionsMessage,
            loadingMessage: () => loadingMessage,
            value: getValue(),
            onChange: handleChange,
            onBlur: field.onBlur,
            className: cn("react-select-container", className),
            classNamePrefix: "react-select",
          }

          const SelectComponent = isAsync
            ? AsyncSelect
            : isCreatable
            ? CreatableSelect
            : Select

          const selectProps = isAsync
            ? {
                ...commonProps,
                loadOptions,
                defaultOptions,
                cacheOptions,
              }
            : isCreatable
            ? {
                ...commonProps,
                options,
                formatCreateLabel:
                  formatCreateLabel ||
                  ((inputValue: string) => `إنشاء "${inputValue}"`),
                onCreateOption: (inputValue: string) => {
                  if (onCreateOption) {
                    onCreateOption(inputValue)
                  }
                  const newOption = { value: inputValue, label: inputValue }
                  if (isMulti) {
                    const currentValues = (field.value || []) as (
                      | string
                      | number
                    )[]
                    field.onChange([...currentValues, inputValue])
                  } else {
                    field.onChange(inputValue)
                  }
                },
              }
            : { ...commonProps, options }

          return (
            <FormItem className={className}>
              {!hideLabel && label && <FormLabel>{label}</FormLabel>}
              <FormControl>
                <SelectComponent {...(selectProps as any)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    )
  }
)

FormSelect.displayName = "FormSelect"

export { FormSelect }
