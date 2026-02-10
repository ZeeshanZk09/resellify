'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { ArrowRight, Loader } from 'lucide-react';
import type React from 'react';
import { useActionState, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { updateProfile } from '@/actions/profile/update-profile';
import { profileSchema } from '@/shared/lib/schemas';
import { useAuth } from '../auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import ErrorAlert from '../ui/error-alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import SuccessAlert from '../ui/success-alert';
import EmailForm from './email-form';

const ProfileForm = () => {
  const { update, user } = useAuth();
  const [upadetEmail, setUpadetEmail] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const name = formData.get('name') as string;
      const phoneNumber = formData.get('phoneNumber') as string;

      try {
        const res = await updateProfile({ name, phoneNumber });
        if (res.error) return { error: res.error, success: '' };

        update({ name, phoneNumber });
        return { success: res.success || 'Profile updated', error: '' };
      } catch {
        return { error: 'Something went wrong', success: '' };
      }
    },
    { success: '', error: '' }
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });
  return (
    <div className='space-y-6 '>
      {/* <UploadImage /> */}
      {/* <Separator /> */}
      <Form {...form}>
        <form action={formAction} className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} name='name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} name='phoneNumber' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <SuccessAlert success={state.success} />
          <ErrorAlert error={state.error || ''} />
          <Button type='submit' disabled={isPending}>
            {isPending && <Loader size={17} className='animate-spin mr-2' />}
            Save changes
          </Button>
        </form>
      </Form>

      <Separator />
      {upadetEmail ? (
        <EmailForm cancel={() => setUpadetEmail(false)} />
      ) : (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='email'>Email Address</Label>
            <Button variant={'link'} onClick={() => setUpadetEmail(true)} size='sm' className='h-6'>
              Edit <ArrowRight />
            </Button>
          </div>
          <Input id='email' type='email' defaultValue={user?.email || ''} readOnly />
        </div>
      )}
    </div>
  );
};
const UploadImage = () => {
  const { user } = useAuth();
  const [image, setImage] = useState(user?.image);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setUploading(true);
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type & size
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG and PNG are allowed.');

        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setError('File size exceeds 3MB limit.');
        return;
      }

      // Show preview before uploading
      const fakeUrl = URL.createObjectURL(file);
      setImage(fakeUrl);
    } catch {
      setError('somting went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 items-start md:items-center'>
      <Avatar className='h-24 w-24'>
        <AvatarImage src={image || undefined} />
        <AvatarFallback className='uppercase'>{(user?.name as string)?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className='space-y-1'>
        <h4 className='text-sm font-medium'>Profile Picture</h4>
        <p className='text-sm text-gray-500'>JPG or PNG. Max size of 3MB.</p>

        {error && typeof error === 'string' && error.length > 0 && error.length < 100 && (
          <p className='text-sm text-red-500'>{error}</p>
        )}

        <input
          ref={inputRef}
          className='hidden'
          type='file'
          onChange={handleChange}
          accept='image/jpeg, image/png'
        />

        <div className='flex space-x-2 mt-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ProfileForm;
