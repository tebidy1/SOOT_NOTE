'use client';

import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/form-message';
import { forgotPassword } from '../actions';
import { Loader2 } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { useActionState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
      إرسال رابط الاستعادة
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPassword, { status: 'idle' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">نسيت كلمة المرور؟</h1>
        <p className="text-muted-foreground">لا تقلق، سنرسل لك تعليمات لإعادة التعيين.</p>
      </div>

      {state.status === 'success' ? (
        <FormMessage variant="success" title="تم الإرسال بنجاح" message="إذا كان بريدك الإلكتروني مسجلاً لدينا، فستتلقى رابط استعادة كلمة المرور قريبًا." />
      ) : (
        <form action={formAction} className="space-y-4">
          {state.status === 'error' && (
            <FormMessage variant="error" message={state.message} />
          )}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" placeholder="mail@example.com" required />
          </div>
          <SubmitButton />
        </form>
      )}

      <Button variant="ghost" asChild className="w-full">
        <Link href="/auth/login">
          <ArrowRight className="me-2 h-4 w-4" />
          العودة لتسجيل الدخول
        </Link>
      </Button>
    </div>
  );
}
