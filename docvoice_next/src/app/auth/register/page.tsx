'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/form-message';
import { authService } from '@/lib/services/auth.service';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApiForm } from '@/components/ui/api-form';
import { Form, FormInput, FormPassword, FormField, FormItem, FormControl, FormLabel, FormMessage as FormFieldMessage } from '@/components/ui/form/index';
import { FormApiError } from '@/components/ui/form-api-error';

const registerSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('بريد إلكتروني صحيح مطلوب'),
    phone: z.string().min(9, 'رقم هاتف صحيح مطلوب'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    terms: z.boolean().refine(val => val === true, 'يجب الموافقة على الشروط'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { form, apiError, clearApiError } = useApiForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            terms: false,
        },
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);

        try {
            clearApiError();
            await authService.register(data.name, data.email, data.phone, data.password);
            router.push('/auth/login');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <div className="w-6 h-6 rounded-lg bg-primary" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">إنشاء حساب جديد</h1>
        <p className="text-muted-foreground mt-1.5">أدخل بياناتك بالأسفل لإنشاء حسابك</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormApiError message={apiError} onDismiss={clearApiError} />

          <FormInput
            control={form.control}
            name="name"
            label="الاسم الكامل"
            placeholder="مثال: محمد"
          />

          <FormInput
            control={form.control}
            name="email"
            label="البريد الإلكتروني"
            type="email"
            placeholder="mail@example.com"
          />

          <FormInput
            control={form.control}
            name="phone"
            label="رقم الهاتف"
            type="tel"
            placeholder="05xxxxxxxx"
          />

          <FormPassword
            control={form.control}
            name="password"
            label="كلمة المرور"
          />

          <FormPassword
            control={form.control}
            name="confirmPassword"
            label="تأكيد كلمة المرور"
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-2.5 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal text-muted-foreground">
                    أوافق على{' '}
                    <Link href="#" className="font-semibold text-foreground hover:text-primary transition-colors">شروط الخدمة</Link> و{' '}
                    <Link href="#" className="font-semibold text-foreground hover:text-primary transition-colors">سياسة الخصوصية</Link>.
                  </FormLabel>
          <FormFieldMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            إنشاء حساب
          </Button>
        </form>
      </Form>
      
      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
