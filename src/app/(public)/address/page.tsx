'use client';

import { DialogTrigger } from '@radix-ui/react-dialog';
import { PlusIcon, Trash2, MapPin } from 'lucide-react';
import type React from 'react';
import { use, useState, Suspense, useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAddress, createAddressAction, deleteAddressAction } from '@/actions/address';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { Address } from '@/shared/lib/generated/prisma/client';
import { cn } from '@/shared/lib/utils';

const addressPromise = getAddress();

export default function AddressPage() {
  return (
    <Suspense fallback={<AddressSkeleton />}>
      <AddressContent initialAddressPromise={addressPromise} />
    </Suspense>
  );
}

function AddressSkeleton() {
  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div className='h-8 w-48 bg-gray-200 animate-pulse rounded' />
        <div className='h-10 w-32 bg-gray-200 animate-pulse rounded' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {[1, 2].map((i) => (
          <div
            key={`addr-skeleton-${i}`}
            className='h-40 bg-gray-50 animate-pulse rounded-xl border border-gray-100'
          />
        ))}
      </div>
    </div>
  );
}

function AddressContent({ initialAddressPromise }: { initialAddressPromise: Promise<Address[]> }) {
  const initialData = use(initialAddressPromise);
  const [addresses, setAddresses] = useState<Address[]>(initialData);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    const chosen = initialData.find((a) => a.isDefault) || initialData[0];
    return chosen?.id || null;
  });

  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createAddressAction, { error: '' });

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      // Refresh addresses list
      getAddress().then(setAddresses);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleDelete = async (id: string) => {
    const res = await deleteAddressAction(id);
    if (res.success) {
      toast.success(res.success);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } else {
      toast.error(res.error);
    }
  };

  return (
    <section className='max-w-4xl mx-auto p-4 md:py-10 space-y-8'>
      <div className='flex justify-between items-center'>
        <h2 className='font-semibold text-lg'>Shipping Address</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' size='sm'>
              <PlusIcon className='h-4 w-4 mr-2' />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <form action={formAction} className='space-y-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='fullName'>Full Name*</Label>
                  <Input id='fullName' name='fullName' placeholder='Receiver Name' required />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone*</Label>
                  <Input id='phone' name='phone' placeholder='0300XXXXXXX' required />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='line1'>Address Line 1*</Label>
                <Input id='line1' name='line1' placeholder='House/Flat No, Street' required />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='city'>City*</Label>
                  <Input id='city' name='city' placeholder='City' required />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='area'>Area/Locality</Label>
                  <Input id='area' name='area' placeholder='Area' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='label'>Label (Optional)</Label>
                  <Input id='label' name='label' placeholder='Home, Office, etc.' />
                </div>
                <div className='flex items-center space-x-2 pt-8'>
                  <input
                    type='checkbox'
                    id='isDefault'
                    name='isDefault'
                    value='true'
                    className='w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500'
                  />
                  <Label htmlFor='isDefault'>Set as default</Label>
                </div>
              </div>

              <input type='hidden' name='country' value='Pakistan' />

              <Button type='submit' className='w-full' disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Address'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {addresses.length === 0 ? (
          <div className='col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200'>
            <MapPin className='h-12 w-12 mx-auto text-gray-300 mb-3' />
            <p className='text-gray-500'>No addresses saved yet.</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              role='button'
              tabIndex={0}
              onClick={() => setSelectedAddressId(addr.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedAddressId(addr.id);
                }
              }}
              className={cn(
                'relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md',
                selectedAddressId === addr.id
                  ? 'border-green-600 bg-green-50/50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h3 className='font-bold text-gray-900'>{addr.fullName}</h3>
                  <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 uppercase'>
                    {addr.label || 'Home'}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addr.id);
                  }}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-1 text-sm text-gray-600'>
                <p className='line-clamp-2'>{addr.line1}</p>
                {addr.line2 && <p className='line-clamp-1'>{addr.line2}</p>}
                <p>
                  {addr.city}, {addr.state || ''}
                </p>
                <p className='font-medium text-gray-900 mt-2'>{addr.phone}</p>
              </div>

              {addr.isDefault && (
                <span className='absolute bottom-5 right-5 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full'>
                  DEFAULT
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
