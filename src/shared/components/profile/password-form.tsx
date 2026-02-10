'use client';

import { CircleCheckBig, TriangleAlert } from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword } from '@/actions/profile/update-password';
import { useAuth } from '../auth-provider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const PasswordForm = () => {
  const { user } = useAuth();

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const currentPassword = formData.get('currentPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (newPassword !== confirmPassword) {
        return { error: 'New password and confirmation do not match.', success: '' };
      }

      try {
        const res = await updatePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });
        return {
          error: res?.error || '',
          success: res?.success || (res?.error ? '' : 'Password updated successfully!'),
        };
      } catch {
        return { error: 'Failed to update password. Please try again.', success: '' };
      }
    },
    { error: '', success: '' }
  );

  return (
    <form action={formAction} className='space-y-4'>
      {user?.password ? (
        <div className='space-y-2'>
          <Label htmlFor='current-password'>Current password</Label>
          <Input id='current-password' name='currentPassword' type='password' required />
        </div>
      ) : (
        <p className='text-sm opacity-60 mb-5'>
          You're using a third-party login. Set a password below if needed.
        </p>
      )}

      <div className={` grid gap-4 ${user?.password ? ' md:grid-cols-2' : ''} `}>
        <div className='space-y-2'>
          <Label htmlFor='new-password'>New password</Label>
          <Input id='new-password' name='newPassword' type='password' required />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirm-password'>Confirm password</Label>
          <Input id='confirm-password' name='confirmPassword' type='password' required />
        </div>
      </div>
      {state.success && (
        <div className='bg-green-100 rounded-lg p-3 items-center mt-4 flex gap-4 '>
          <CircleCheckBig className='text-green-500' />
          <div className='text-left'>
            <h4 className='text-xs font-medium'>success</h4>
            <p className='text-xm opacity-70'>{state.success}</p>
          </div>
        </div>
      )}
      {state.error && (
        <div className='bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 '>
          <TriangleAlert className='text-destructive/60' />
          <div className='text-left'>
            <h4 className='text-xs font-medium'>Error</h4>
            <p className='text-xm opacity-70'>{state.error}</p>
          </div>
        </div>
      )}
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
};

export default PasswordForm;
