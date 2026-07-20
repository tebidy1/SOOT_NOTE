import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صالح.' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة.' }),
  remember: z.boolean().optional(),
});

export const RegisterSchema = z
  .object({
    name: z.string().min(2, { message: 'يجب أن يتكون الاسم من حرفين على الأقل.' }),
    email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صالح.' }),
    password: z.string().min(8, { message: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' }),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'يجب أن توافق على الشروط والأحكام.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين.',
    path: ['confirmPassword'],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صالح.' }),
});

export const ResetPasswordSchema = z.object({
    password: z.string().min(8, { message: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
  });
