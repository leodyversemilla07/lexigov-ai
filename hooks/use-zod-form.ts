/**
 * useZodForm Hook
 * Wraps react-hook-form with Zod resolver for type-safe form validation
 */
import { useForm, type UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'

type UseZodFormProps<T extends z.ZodType> = Omit<
    UseFormProps<z.infer<T>>,
    'resolver'
> & {
    schema: T
}

/**
 * Custom hook that combines react-hook-form with Zod validation
 * 
 * @example
 * ```tsx
 * import { loginSchema } from '@repo/types'
 * 
 * const form = useZodForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' }
 * })
 * 
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <input {...form.register('email')} />
 *   {form.formState.errors.email?.message}
 * </form>
 * ```
 */
export function useZodForm<T extends z.ZodType>({
    schema,
    ...formProps
}: UseZodFormProps<T>) {
    return useForm<z.infer<T>>({
        ...formProps,
        resolver: zodResolver(schema as z.ZodType<z.infer<T>>)
    })
}
