'use client';
import { CreditCard, Shield, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { getUser } from '@/actions/profile/user-accounts';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import type { Role } from '@/shared/lib/generated/prisma/enums';
import { useAuth } from '../auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import BillingHistory from './billing-history';
import DeleteAccount from './delete-account';
import PasswordForm from './password-form';
import ProfileForm from './profile-form';

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean;
};

const ManageAccount = ({ setOpen, open }: Props) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className='flex-1'>
          <Tabs
            defaultValue='profile'
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='mb-6 flex space-x-2'>
              <TabsTrigger value='profile' className='flex items-center'>
                <User className='h-4 w-4 mr-2' />
                Profile
              </TabsTrigger>
              <TabsTrigger value='account' className='flex items-center'>
                <Shield className='h-4 w-4 mr-2' />
                Account
              </TabsTrigger>
              <TabsTrigger value='billing' className='flex items-center'>
                <CreditCard className='h-4 w-4 mr-2' />
                Billing
              </TabsTrigger>
            </TabsList>
            <TabsContent value='profile'>
              <ProfileForm />
            </TabsContent>
            <TabsContent value='account'>
              <div className='space-y-6'>
                <PasswordForm />

                {user && (
                  <>
                    {' '}
                    <Separator />
                    <div className='space-y-2'>
                      <h4 className='font-medium'>Connected accounts</h4>
                      <div>
                        <div className='flex gap-2'>
                          <h4 className='text-sm capitalize'>{user.email}</h4>
                          <div>
                            <p className='opacity-70 text-sm'>• {user.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>{' '}
                  </>
                )}
                <Separator />
                <DeleteAccount />
              </div>
            </TabsContent>
            <TabsContent value='billing'>
              <BillingHistory />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAccount;
