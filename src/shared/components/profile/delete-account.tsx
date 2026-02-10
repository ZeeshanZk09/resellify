'use client';
import { CircleCheckBig, Loader, Trash2, TriangleAlert } from 'lucide-react';
import { signOut } from 'next-auth/react';
import type React from 'react';
import { useState, useActionState, useEffect } from 'react';
import { deleteAccount } from '@/actions/profile/delete-account';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const DeleteAccount = () => {
  const [isDelete, setDelete] = useState(false);
  return (
    <>
      <div className='flex justify-between !mb-0'>
        <h4 className='font-medium'>Delete account</h4>

        <Button onClick={() => setDelete(true)} variant='destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </Button>
      </div>
      {isDelete && <DeleteForm setDelete={setDelete} />}
    </>
  );
};
const DeleteForm = ({
  setDelete,
}: {
  setDelete: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
  const correctCommand = 'Delete account';

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(async () => {
        await signOut({ callbackUrl: '/' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  return (
    <>
      <div className='absolute h-full w-full inset-0 bg-black/20 z-20' />
      <Card className='absolute  w-full max-w-sm  z-30 border rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <CardHeader className=''>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Are you sure you want to delete your account?
            <br />
            <span className='text-destructive'>This action is permanent and irreversible.</span>
          </CardDescription>
          {state?.success && (
            <div className='bg-green-100 rounded-lg p-3 items-center mt-4 flex gap-4 '>
              <CircleCheckBig className='text-green-500' />
              <div className='text-left'>
                <h4 className='text-xs font-medium'>success</h4>
                <p className='text-sm opacity-70'>{state.success}</p>
              </div>
            </div>
          )}
          {state?.error && (
            <div className='bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 '>
              <TriangleAlert className='text-destructive/60' />
              <div className='text-left'>
                <h4 className='text-xs font-medium'>Error</h4>
                <p className='text-sm opacity-70'>{state.error}</p>
              </div>
            </div>
          )}
        </CardHeader>
        <form action={formAction}>
          <CardContent className='space-y-2  mt-6'>
            <Label htmlFor='command' className='block'>
              Type "{correctCommand}" below to continue.
            </Label>
            <Input id='command' name='command' placeholder={correctCommand} required />
          </CardContent>

          <CardFooter className='justify-end mt-6 gap-4'>
            <Button
              type='button'
              variant={'secondary'}
              onClick={() => setDelete(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending} variant={'destructive'}>
              Delete account {isPending && <Loader className='animate-spin ml-2 h-4 w-4' />}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default DeleteAccount;
