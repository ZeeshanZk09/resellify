'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { InputOTP, InputOTPSlot } from '../ui/input-otp';
import { Button } from '../ui/button';
import { Loader } from 'lucide-react';
import { sendVerification } from '@/actions/send-verification';
import ErrorAlert from '../ui/error-alert';
import SuccessAlert from '../ui/success-alert';

type Props = {
  title: string;
  email: string;
  onVerify: (code: string) => Promise<{ success?: string; error?: string }>;
  onSuccess?: () => void;
};

function VerifyCode({ email, title, onVerify, onSuccess }: Props) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resend = async () => {
    try {
      await sendVerification(email);
      setSuccess('Verification email sent with success');
    } catch (error) {
      setError('Failed to send verification email. Please try again later.');
    }
  };
  const onVerifyCode = async () => {
    setError('');
    setSuccess(null);
    setIsLoading(true);
    try {
      const res = await onVerify(otp);
      if (res.error) {
        setError(res.error);
        setOtp('');
        return;
      }
      setSuccess(res?.success || null);
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className='w-[350px] text-center'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email <br />
          {email}{' '}
        </CardDescription>
        <SuccessAlert success={success} />
        <ErrorAlert error={error} />
      </CardHeader>
      <CardContent className='flex flex-col  items-center'>
        <InputOTP maxLength={6} value={otp} onChange={(e) => setOtp(e)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPSlot key={i + 'otp'} index={i} className='border rounded-sm' />
          ))}
        </InputOTP>
        <Button type='button' onClick={resend} variant={'link'} className='text-center mt-2 flex'>
          Didn't receive a code? Resend
        </Button>
      </CardContent>

      <Button onClick={onVerifyCode} disabled={isLoading} className='w-[80%] mx-auto'>
        Verify {isLoading && <Loader className='animate-spin' />}
      </Button>
    </Card>
  );
}

export default VerifyCode;
