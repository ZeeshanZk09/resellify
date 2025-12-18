import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import VerifyCode from '@/shared/components/auth/verify-code';
import { verifyEmail } from '@/actions/auth/register';

const VerifyEmail = async () => {
  const cookieStore = await cookies();
  const email = cookieStore.get('login_email')?.value;
  const password = cookieStore.get('login_password')?.value;
  if (!email || !password) redirect('/auth/sign-up');

  return <VerifyCode email={email} title='Verify your email' onVerify={verifyEmail} />;
};

export default VerifyEmail;
