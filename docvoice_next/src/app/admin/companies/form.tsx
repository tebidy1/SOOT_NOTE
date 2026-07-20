"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { ApiForm } from "@/components/ui/api-form"
import { FormInput, FormSelect } from "@/components/ui/form/index"
import { Loader2 } from "lucide-react"
import { Company } from "./columns"

const formSchema = z.object({
  name: z.string().min(2, "اسم الشركة مطلوب"),
  invitation_code: z.string().optional(),
  plan_type: z.string().min(1, "نوع الخطة مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  admin_name: z.string().optional(),
  admin_email: z.string().email().optional().or(z.literal('')),
  admin_password: z.string().min(8).optional().or(z.literal('')),
})

type CompanyFormValues = z.infer<typeof formSchema>

interface CompanyFormProps {
  onSubmit: (values: any) => void
  isPending: boolean
  initialData?: Company | null
}

const planOptions = [
  { value: 'basic', label: 'أساسية' },
  { value: 'standard', label: 'قياسية' },
  { value: 'premium', label: 'ممتازة' },
]

const statusOptions = [
  { value: 'active', label: 'نشط' },
  { value: 'suspended', label: 'معلق' },
]

export function CompanyForm({ onSubmit, isPending, initialData }: CompanyFormProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    const payload: any = {
      name: data.name,
      invitation_code: data.invitation_code || undefined,
      plan_type: data.plan_type,
      status: data.status,
    }
    if (!initialData) {
      payload.admin_name = data.admin_name
      payload.admin_email = data.admin_email
      payload.admin_password = data.admin_password
    }
    await onSubmit(payload)
  }

  const defaultValues = initialData
    ? {
        name: initialData.name,
        invitation_code: initialData.invitation_code || '',
        plan_type: initialData.plan_type,
        status: initialData.status,
        admin_name: '',
        admin_email: '',
        admin_password: '',
      }
    : {
        name: '',
        invitation_code: '',
        plan_type: 'basic',
        status: 'active',
        admin_name: '',
        admin_email: '',
        admin_password: '',
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
          <div className="text-sm font-bold text-blue-600 mb-2">معلومات الشركة</div>

          <FormInput
            control={form.control}
            name="name"
            label="اسم الشركة"
            placeholder="أدخل اسم الشركة"
          />

          <FormInput
            control={form.control}
            name="invitation_code"
            label="رمز الدعوة"
            placeholder="اختياري"
          />

          <FormSelect
            control={form.control}
            name="plan_type"
            label="نوع الخطة"
            placeholder="اختر الخطة"
            options={planOptions}
          />

          <FormSelect
            control={form.control}
            name="status"
            label="الحالة"
            placeholder="اختر الحالة"
            options={statusOptions}
          />

          {!initialData && (
            <>
              <div className="text-sm font-bold text-blue-600 mb-2 mt-4">معلومات الأدمن</div>

              <FormInput
                control={form.control}
                name="admin_name"
                label="اسم الأدمن"
                placeholder="أدخل اسم الأدمن"
              />

              <FormInput
                control={form.control}
                name="admin_email"
                label="البريد الإلكتروني للأدمن"
                type="email"
                placeholder="admin@example.com"
              />

              <FormInput
                control={form.control}
                name="admin_password"
                label="كلمة مرور الأدمن"
                type="password"
                placeholder="••••••••"
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </>
      )}
    </ApiForm>
  )
}
