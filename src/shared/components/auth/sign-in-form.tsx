'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useActionState, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { checkEmail } from '@/actions/auth/login';
import { loginFormSchemaEmail } from '@/shared/lib/schemas';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ErrorAlert from '../ui/error-alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import SuccessAlert from '../ui/success-alert';
import OAuth from './o-auth';

const SignInForm = () => {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const email = formData.get('email') as string;
      try {
        const res = await checkEmail(email);
        if (res.error) {
          return { error: res.error, success: '' };
        }
        if (res.success) {
          setTimeout(() => {
            router.push('/auth/sign-in/factor-one');
          }, 1200);
          return { success: res.success, error: '' };
        }
        return { error: 'Something went wrong', success: '' };
      } catch {
        return { error: 'Something went wrong', success: '' };
      }
    },
    { success: '', error: '' }
  );

  const [isVisible, setIsVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  useEffect(() => {
    if (state.success) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [state.success]);

  useEffect(() => {
    if (state.error) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => setIsErrorVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    setIsErrorVisible(false);
  }, [state.error]);

  const form = useForm<z.infer<typeof loginFormSchemaEmail>>({
    resolver: zodResolver(loginFormSchemaEmail),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Card className='w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl'>Sign in</CardTitle>
        <CardDescription>Welcome back! Please sign in to continue</CardDescription>
        {isVisible && <SuccessAlert success={state.success} />}
        {isErrorVisible && <ErrorAlert error={state.error} />}
      </CardHeader>
      <CardContent className='grid gap-6'>
        <OAuth setError={() => {}} />
        <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
          <span className='relative z-10 bg-card px-2 text-muted-foreground'>Or continue with</span>
        </div>

        <Form {...form}>
          <form action={formAction} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='you@example.com' type='email' {...field} name='email' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? <Loader size={17} className='animate-spin' /> : <> Continue </>}
            </Button>
          </form>
        </Form>
        <div className='text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link href='/auth/sign-up' className='underline underline-offset-4'>
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
