'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signUpFormSchema } from '@/shared/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorAlert from '../ui/error-alert';
import OAuth from './o-auth';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/actions/auth/register';

const SignUpForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [seePassword, setSeePassword] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  const onSubmit = async (values: z.infer<typeof signUpFormSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await registerUser(values);
      if (res.error) {
        setError(res.error || 'Something went wrong');
        return;
      }
      router.push('/auth/sign-up/verify-email');
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className='w-full min-w-sm max-w-sm '>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Create your account</CardTitle>
          <CardDescription>Welcome! Please fill in the details to get started.</CardDescription>
          <ErrorAlert error={error} />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='grid gap-6'>
                <OAuth setError={setError} />
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
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder='Your full name' {...field} />
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
                          <Input placeholder='shadcn' type='email' {...field} />
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

                  <Button disabled={isLoading} type='submit' className='w-full gap-2'>
                    Submit {isLoading && <Loader size={17} className='animate-spin' />}
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
    </>
  );
};

export default SignUpForm;
