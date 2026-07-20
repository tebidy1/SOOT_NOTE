'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useApiForm } from '@/components/ui/api-form';
import { FormApiError } from '@/components/ui/form-api-error';
import { Form } from '@/components/ui/form';
import { FormInput, FormSelect } from '@/components/ui/form/index';
import { User, CreateUserData } from '@/types/users';

const userSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  role: z.enum(['admin', 'manager', 'user']),
  status: z.enum(['active', 'inactive', 'pending']),
});

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { form, apiError, clearApiError } = useApiForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'user',
      status: user?.status || 'active',
    },
    resolver: zodResolver(userSchema),
  });

  const handleFormSubmit = (data: z.infer<typeof userSchema>) => {
    onSubmit(data as CreateUserData);
  };

  const wrappedSubmit = async (data: z.infer<typeof userSchema>) => {
    handleFormSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(wrappedSubmit)} className="space-y-4">
        <FormApiError message={apiError} onDismiss={clearApiError} />
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
          placeholder="أدخل البريد الإلكتروني"
        />

        <FormInput
          control={form.control}
          name="phone"
          label="رقم الهاتف"
          type="tel"
          placeholder="أدخل رقم الهاتف"
        />

        <FormSelect
          control={form.control}
          name="role"
          label="الدور"
          placeholder="اختر الدور"
          options={[
            { value: 'admin', label: 'مدير' },
            { value: 'manager', label: 'مدير تنفيذي' },
            { value: 'user', label: 'مستخدم' },
          ]}
        />

        <FormSelect
          control={form.control}
          name="status"
          label="الحالة"
          placeholder="اختر الحالة"
          options={[
            { value: 'active', label: 'نشط' },
            { value: 'inactive', label: 'غير نشط' },
            { value: 'pending', label: 'معلق' },
          ]}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : user ? 'تحديث' : 'إنشاء'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
