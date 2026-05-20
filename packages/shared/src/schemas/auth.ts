/**
 * Authentication Zod Schemas
 * Validation for login, registration, and profile updates
 */
import { z } from 'zod';

// Email validation (reusable)
const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email address');

// Password validation (reusable)
const passwordSchema = z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  organization: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  organization: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
