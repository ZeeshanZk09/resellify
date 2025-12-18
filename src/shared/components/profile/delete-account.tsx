'use client';
import React, { useState, useTransition } from 'react';
import { Button } from '../ui/button';
import { CircleCheckBig, Eye, EyeOff, Loader, Trash2, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { deleteAccount } from '@/actions/profile/delete-account';
import { signOut } from 'next-auth/react';

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
  const [command, setCommand] = useState('');
  const correctCommand = 'Delete account';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const verifyCode = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    startTransition(async () => {
      try {
        if (!command) {
          setError(`Please enter "Delete account" `);
          return;
        }
        if (command !== correctCommand) {
          setError('Incorrect command');
          return;
        }
        const res = await deleteAccount(command);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.success) {
          setSuccess(res?.success || 'Account deleted successfully!');
          setDelete(false);
          await signOut();
        }
      } catch (error) {
        console.log(error);
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    });
  };

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
          {success && (
            <div className='bg-green-100 rounded-lg p-3 items-center mt-4 flex gap-4 '>
              <CircleCheckBig className='text-green-500' />
              <div className='text-left'>
                <h4 className='text-xs font-medium'>success</h4>
                <p className='text-xm opacity-70'>{success}</p>
              </div>
            </div>
          )}
          {error && (
            <div className='bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 '>
              <TriangleAlert className='text-destructive/60' />
              <div className='text-left'>
                <h4 className='text-xs font-medium'>Error</h4>
                <p className='text-xm opacity-70'>{error}</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className='space-y-2  mt-6'>
          <Label htmlFor='command' className='block'>
            Type "{correctCommand}" below to continue.
          </Label>
          <Input
            id='command'
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={correctCommand}
            required
          />
        </CardContent>

        <CardFooter className='justify-end mt-6 gap-4'>
          <Button variant={'secondary'} onClick={() => setDelete(false)}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || isPending || command !== correctCommand}
            variant={'destructive'}
            onClick={verifyCode}
          >
            Delete account {isLoading || (isPending && <Loader className='animate-spin' />)}
            {isPending && <Loader className='animate-spin' />}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default DeleteAccount;
