"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { ApiForm } from "@/components/ui/api-form"
import { FormInput, FormSelect } from "@/components/ui/form/index"
import { Loader2 } from "lucide-react"
import { User } from "./columns"
import { useQuery } from "@tanstack/react-query"
import { medicalDepartmentService } from "@/lib/services/medical-department.service"
import { companyService } from "@/lib/services/company.service"

const formSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب (3 أحرف على الأقل)"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone_number: z.string().min(10, "رقم الهاتف غير صالح"),
  password: z.string().optional(),
  role: z.string().min(1, "الدور مطلوب"),
  company_id: z.string().optional(),
  medical_department_id: z.string().optional(),
  status: z.string().default('active'),
})

type UserFormValues = z.infer<typeof formSchema>

interface UserFormProps {
  onSubmit: (values: UserFormValues) => void
  isPending: boolean
  initialData?: User | null
}

const roleOptions = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'company_manager', label: 'مدير الشركة' },
  { value: 'member', label: 'عضو' },
]

export function UserForm({ onSubmit, isPending, initialData }: UserFormProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    await onSubmit(data as UserFormValues)
  }

  const { data: departmentsResponse } = useQuery({
    queryKey: ['medical-departments'],
    queryFn: () => medicalDepartmentService.getDepartments(),
  })

  const { data: companiesResponse } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
  })

  const departments = Array.isArray(departmentsResponse)
    ? departmentsResponse
    : (departmentsResponse as any)?.payload || (departmentsResponse as any)?.data || []

  const companies = Array.isArray(companiesResponse)
    ? companiesResponse
    : (companiesResponse as any)?.payload || (companiesResponse as any)?.data || []

  const departmentOptions = departments.map((dept: any) => ({
    value: String(dept.id),
    label: dept.name_ar || dept.name_en,
  }))

  const companyOptions = companies.map((company: any) => ({
    value: String(company.id),
    label: company.name,
  }))

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
  ]

  const defaultValues = initialData
    ? {
        name: initialData.name,
        email: initialData.email,
        phone_number: initialData.phone_number || '',
        password: '',
        role: initialData.role,
        company_id: initialData.company_id ? String(initialData.company_id) : '',
        medical_department_id: initialData.medical_department_id ? String(initialData.medical_department_id) : '',
        status: initialData.status || 'active',
      }
    : {
        name: '',
        email: '',
        phone_number: '',
        password: '',
        role: 'member',
        company_id: '',
        medical_department_id: '',
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
            name="phone_number"
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
            name="company_id"
            label="الشركة"
            placeholder="اختر الشركة"
            options={companyOptions}
          />

          <FormSelect
            control={form.control}
            name="role"
            label="الدور"
            placeholder="اختر الدور"
            options={roleOptions}
          />

          <FormSelect
            control={form.control}
            name="medical_department_id"
            label="القسم"
            placeholder="اختر القسم"
            options={departmentOptions}
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
