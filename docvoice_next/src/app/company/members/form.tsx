"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { ApiForm } from "@/components/ui/api-form"
import { FormInput, FormSelect } from "@/components/ui/form/index"
import { Loader2 } from "lucide-react"
import { Member } from "./columns"

const formSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب (3 أحرف على الأقل)"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  password: z.string().optional(),
  role: z.string().min(1, "الدور مطلوب"),
  status: z.string().default('active'),
})

type MemberFormValues = z.infer<typeof formSchema>

interface MemberFormProps {
  onSubmit: (values: MemberFormValues) => void
  isPending: boolean
  initialData?: Member | null
}

const roleOptions = [
  { value: 'member', label: 'عضو' },
  // { value: 'company_manager', label: 'مدير الشركة' },
]

const statusOptions = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export function MemberForm({ onSubmit, isPending, initialData }: MemberFormProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    await onSubmit(data as MemberFormValues)
  }

  const defaultValues = initialData
    ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone || initialData.phone_number || '',
      password: '',
      role: initialData.role,
      status: initialData.status || 'active',
    }
    : {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'member',
      status: 'active',
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
            name="name"
            label="الاسم"
            placeholder="أدخل الاسم"
          />

          <FormInput
            control={form.control}
            name="email"
            label="البريد الإلكتروني"
            type="email"
            placeholder="example@email.com"
          />

          <FormInput
            control={form.control}
            name="phone"
            label="رقم الهاتف"
            placeholder="05xxxxxxxx"
          />

          {!initialData && (
            <FormInput
              control={form.control}
              name="password"
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
            />
          )}

          <FormSelect
            control={form.control}
            name="role"
            label="الدور"
            placeholder="اختر الدور"
            options={roleOptions}
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
