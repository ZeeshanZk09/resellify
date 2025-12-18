'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader } from 'lucide-react';
import { resetPassword, verifyCode } from '@/actions/auth/resset-password';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@/shared/lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import ErrorAlert from '../ui/error-alert';
import SuccessAlert from '../ui/success-alert';
import VerifyCode from './verify-code';

type Props = {
  email: string;
};

const ResetPasswordForm = ({ email }: Props) => {
  const [isValid, setIsValide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await resetPassword({
        password: values.newPassword,
        confirmPassword: values.confirmPassword,
        email,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.success) {
        setSuccess(res.success);
        window.location.href = '/';
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  return !isValid ? (
    <VerifyCode
      email={email}
      title='Reset password'
      onVerify={verifyCode}
      onSuccess={() => setIsValide(true)}
    />
  ) : (
    <Card className='w-sm '>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl capitalize font-semibold '>Set new password</CardTitle>
        <SuccessAlert success={success} />
        <ErrorAlert error={error} />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-4'>
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input placeholder='shadcn' className='pr-10' type='password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input placeholder='shadcn' className='pr-10' type='password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='w-full' disabled={isLoading}>
              {isLoading ? <Loader className='animate-spin' /> : 'Reset Password '}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
