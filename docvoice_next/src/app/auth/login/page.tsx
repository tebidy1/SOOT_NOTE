'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApiForm } from '@/components/ui/api-form';
import { FormApiError } from '@/components/ui/form-api-error';
import { Form, FormInput, FormPassword } from '@/components/ui/form/index';
import { Logo } from '@/components/scribe/logo';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getDashboardPath = (role?: string): string => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'admin') return '/admin/dashboard';
  if (normalizedRole === 'manager') return '/company/dashboard';
  return '/member/dashboard';
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [redirectParam, setRedirectParam] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectParam(params.get('redirect'));
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectParam || getDashboardPath(user.role));
    }
  }, [authLoading, user, router, redirectParam]);

  const { form, apiError, clearApiError } = useApiForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: Record<string, any>) => {
    setLoading(true);

    try {
      const result = await signIn(data.email as string, data.password as string);

      if (result?.user) {
        router.replace(redirectParam || getDashboardPath(result.user.role));
      }
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {authLoading || user ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="w-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg p-4">
              <Logo className="w-full max-w-[260px] h-auto" variant="light" />
            </div>
            <p className="text-gray-600">نظام التوثيق الصوتي الطبي</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormApiError message={apiError} onDismiss={clearApiError} />

              <FormInput
                control={form.control}
                name="email"
                label="البريد الإلكتروني"
                type="email"
                placeholder="doctor@hospital.com"
              />

              <FormPassword
                control={form.control}
                name="password"
                label="كلمة المرور"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={form.watch('remember')}
                    onChange={(e) => form.setValue('remember', e.target.checked)}
                    className="h-4 w-4 rounded border-muted-foreground/30 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 transition-colors"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">تذكرني</span>
                </label>
                <Link href="/auth/forgot-password" passHref className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-gray-500">أو استمر بواسطة</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="w-full border-2 border-blue-200 text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
            </svg>
            إنشاء حساب جديد
          </Link>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>نظام توثيق صوتي طبي آمن</p>
          </div>
        </>
      )}
    </div>
  );
}
