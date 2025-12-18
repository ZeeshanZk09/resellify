import { z } from 'zod';
export const signUpFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Username must be at least 2 characters.')
    .max(30, 'Username must be at most 20 characters.'),

  email: z.string().email('Please enter a valid email address.'),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[\W_]/, { message: 'Password must contain at least one special character.' }),
});
export const loginFormSchemaEmail = z.object({
  email: z.string().email('Please enter a valid email address.'),
});
export const loginFormSchemaPassword = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
      .regex(/[\W_]/, { message: 'Password must contain at least one special character.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  name: z.string().min(2, 'Username must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});
