import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.');

const e164PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international format, e.g. +84901234567.');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password is too long.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/\d/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const signUpStepOneSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Full name is required.')
      .max(120, 'Full name is too long.'),
    contact_method: z.enum(['email', 'phone']),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contact_method === 'email') {
      const parsedEmail = emailSchema.safeParse(value.email ?? '');
      if (!parsedEmail.success) {
        const message = parsedEmail.error.issues[0]?.message ?? 'Email is invalid.';
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message });
      }
      return;
    }

    const parsedPhone = e164PhoneSchema.safeParse(value.phone ?? '');
    if (!parsedPhone.success) {
      const message = parsedPhone.error.issues[0]?.message ?? 'Phone is invalid.';
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message });
    }
  });

export const signUpStepTwoSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Please retype your password.'),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirm_password'],
        message: 'Passwords do not match.',
      });
    }
  });

export const signUpSchema = signUpStepOneSchema.merge(signUpStepTwoSchema);

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpStepOneValues = z.infer<typeof signUpStepOneSchema>;
export type SignUpStepTwoValues = z.infer<typeof signUpStepTwoSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
