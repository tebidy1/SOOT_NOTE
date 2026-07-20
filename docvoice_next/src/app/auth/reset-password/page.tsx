'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/form-message';
import { Loader2, ArrowRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApiForm } from '@/components/ui/api-form';
import { Form } from '@/components/ui/form';
import { FormPassword } from '@/components/ui/form/form-password';
import { FormApiError } from '@/components/ui/form-api-error';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { form, apiError, clearApiError } = useApiForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    console.log('Reset password:', data);
  };

  const handleSubmit = async (data: ResetPasswordFormValues) => {
    await onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
        <p className="text-muted-foreground">يجب أن تكون كلمة المرور الجديدة مختلفة عن السابقة.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormApiError message={apiError} onDismiss={clearApiError} />

          <FormPassword
            control={form.control}
            name="password"
            label="كلمة المرور الجديدة"
          />

          <FormPassword
            control={form.control}
            name="confirmPassword"
            label="تأكيد كلمة المرور الجديدة"
          />

          <Button type="submit" className="w-full">
            إعادة تعيين كلمة المرور
          </Button>
        </form>
      </Form>
    </div>
  );
}
