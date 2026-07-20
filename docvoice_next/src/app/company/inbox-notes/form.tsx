"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { ApiForm } from "@/components/ui/api-form"
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/form/index"
import { Loader2 } from "lucide-react"
import { InboxNote } from "./columns"

const formSchema = z.object({
  patient_name: z.string().optional(),
  raw_text: z.string().min(1, "النص مطلوب"),
  summary: z.string().optional(),
  status: z.string().default('pending'),
})

type InboxNoteFormValues = z.infer<typeof formSchema>

interface InboxNoteFormProps {
  onSubmit: (values: InboxNoteFormValues) => void
  isPending: boolean
  initialData?: InboxNote | null
}

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'processed', label: 'تمت المعالجة' },
  { value: 'archived', label: 'مؤرشفة' },
]

export function InboxNoteForm({ onSubmit, isPending, initialData }: InboxNoteFormProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    await onSubmit(data as InboxNoteFormValues)
  }

  const defaultValues = initialData
    ? {
        patient_name: initialData.patient_name || '',
        raw_text: initialData.raw_text,
        summary: initialData.summary || '',
        status: initialData.status,
      }
    : {
        patient_name: '',
        raw_text: '',
        summary: '',
        status: 'pending',
      }

  return (
    <ApiForm
      defaultValues={defaultValues}
      resolver={zodResolver(formSchema)}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {(form) => (
        <>
          <FormInput
            control={form.control}
            name="patient_name"
            label="اسم المريض"
            placeholder="أدخل اسم المريض (اختياري)"
          />

          <FormTextarea
            control={form.control}
            name="raw_text"
            label="النص"
          />

          <FormTextarea
            control={form.control}
            name="summary"
            label="الملخص"
          />

          <FormSelect
            control={form.control}
            name="status"
            label="الحالة"
            placeholder="اختر الحالة"
            options={statusOptions}
          />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </>
      )}
    </ApiForm>
  )
}
