import ResetPasswordForm from '@/shared/components/auth/reset-password-form';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import React from 'react';

const page = async () => {
  const cookieStore = await cookies();
  const email = cookieStore.get('login_email')?.value;
  if (!email) redirect('/auth/sign-in');
  return <ResetPasswordForm email={email} />;
};

export default page;
