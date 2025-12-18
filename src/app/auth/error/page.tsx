import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

const Error = () => {
  return (
    <div className='text-center'>
      <h1 className='text-2xl'>Authentication Error</h1>
      <p className='text-zinc-600 dark:text-zinc-400 max-w-sm text-lg mx-auto mt-4'>
        Oops! Something went wrong during authentication. Please try again.
      </p>

      <Button asChild className='mt-5'>
        <Link href='/auth/sign-in'>Go to Sign-In</Link>
      </Button>
    </div>
  );
};

export default Error;
