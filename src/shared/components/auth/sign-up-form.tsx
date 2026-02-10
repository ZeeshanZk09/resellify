'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useActionState, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { registerUser } from '@/actions/auth/register';
import { signUpFormSchema } from '@/shared/lib/schemas';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ErrorAlert from '../ui/error-alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import OAuth from './o-auth';

const SignUpForm = () => {
  const router = useRouter();
  const [seePassword, setSeePassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      try {
        const res = await registerUser({ name, email, password });
        if (res.error) {
          return { error: res.error || 'Something went wrong', success: '' };
        }
        router.push('/auth/sign-up/verify-email');
        return { success: 'Success', error: '' };
      } catch {
        return { error: 'Something went wrong', success: '' };
      }
    },
    { success: '', error: '' }
  );

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  return (
    <Card className='w-full min-w-sm max-w-sm '>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl'>Create your account</CardTitle>
        <CardDescription>Welcome! Please fill in the details to get started.</CardDescription>
        <ErrorAlert error={state.error} />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction}>
            <div className='grid gap-6'>
              <OAuth setError={() => {}} />
              <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
                <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
              <div className='grid gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Your full name' {...field} name='name' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='shadcn' type='email' {...field} name='email' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            placeholder='shadcn'
                            className='pr-10'
                            type={seePassword ? 'text' : 'password'}
                            {...field}
                            name='password'
                          />
                          <Button
                            onClick={() => setSeePassword((prev) => !prev)}
                            type='button'
                            className='absolute bg-transparent hover:bg-transparent top-0 right-0'
                            size={'icon'}
                            variant={'secondary'}
                          >
                            {seePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isPending} type='submit' className='w-full gap-2'>
                  Submit {isPending && <Loader size={17} className='animate-spin' />}
                </Button>
              </div>
              <div className='text-center text-sm'>
                Already have an account?{' '}
                <Link href='/auth/sign-in' className='underline underline-offset-4'>
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
