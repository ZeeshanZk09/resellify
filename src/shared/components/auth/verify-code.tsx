'use client';
import { Loader } from 'lucide-react';
import React, { useActionState, useState } from 'react';
import { sendVerification } from '@/actions/send-verification';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ErrorAlert from '../ui/error-alert';
import { InputOTP, InputOTPSlot } from '../ui/input-otp';
import SuccessAlert from '../ui/success-alert';

type Props = {
  readonly title: string;
  readonly email: string;
  readonly onVerify: (code: string) => Promise<{ success?: string; error?: string }>;
  readonly onSuccess?: () => void;
};

function VerifyCode({ email, title, onVerify, onSuccess }: Props) {
  const [otp, setOtp] = useState('');
  const [resendState, resendAction, isResending] = useActionState(
    async () => {
      try {
        await sendVerification(email);
        return { success: 'Verification email sent with success', error: '' };
      } catch {
        return { error: 'Failed to send verification email. Please try again later.', success: '' };
      }
    },
    { success: '', error: '' }
  );

  const [verifyState, verifyAction, isVerifying] = useActionState(
    async (_prevState: any, code: string) => {
      try {
        const res = await onVerify(code);
        if (res.error) {
          setOtp('');
          return { error: res.error, success: '' };
        }

        if (onSuccess) {
          onSuccess();
        } else {
          globalThis.location.href = '/';
        }
        return { success: res?.success || 'Verified!', error: '' };
      } catch {
        return { error: 'Something went wrong', success: '' };
      }
    },
    { success: '', error: '' }
  );

  const error = verifyState.error || resendState.error;
  const success = verifyState.success || resendState.success;
  const isLoading = isVerifying || isResending;

  return (
    <Card className='w-87.5 text-center'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email <br />
          {email}{' '}
        </CardDescription>
        <SuccessAlert success={success || null} />
        <ErrorAlert error={error || ''} />
      </CardHeader>
      <CardContent className='flex flex-col  items-center'>
        <InputOTP maxLength={6} value={otp} onChange={(e) => setOtp(e)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPSlot key={i + 'otp'} index={i} className='border rounded-sm' />
          ))}
        </InputOTP>
        <form action={resendAction}>
          <Button
            type='submit'
            variant={'link'}
            className='text-center mt-2 flex'
            disabled={isLoading}
          >
            Didn't receive a code? Resend
          </Button>
        </form>
      </CardContent>

      <Button
        onClick={() => {
          verifyAction(otp);
        }}
        disabled={isLoading || otp.length < 6}
        className='w-[80%] mx-auto'
      >
        Verify {isLoading && <Loader className='animate-spin' />}
      </Button>
    </Card>
  );
}

export default VerifyCode;
