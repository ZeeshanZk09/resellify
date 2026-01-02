'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { PlusIcon, SendIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Address } from '@/shared/lib/generated/prisma/client';
import { createAddress, getAddress } from '@/actions/address';
import { toast } from 'sonner';

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    label: '',
    phone: '',
    whatsappNumber: '',
    line1: '',
    line2: '',
    city: '',
    area: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    isDefault: false,
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Fix: Load addresses on mount
  const fetchAddresses = useCallback(async () => {
    setAddressLoading(true); // Set loading start
    try {
      const addrList = (await getAddress()) as Address[];
      setAddresses(addrList || []);
      // Fix: Don't select if no addresses exist
      if (addrList && addrList.length > 0) {
        let chosen = addrList.find((a) => a.isDefault) || addrList[0];
        setSelectedAddressId(chosen?.id || null);
      } else {
        setSelectedAddressId(null);
      }
    } catch (e) {
      console.log(e);
      setAddresses([]);
      setSelectedAddressId(null);
      toast.error('Could not fetch addresses!');
    } finally {
      setAddressLoading(false); // Set loading end
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount
    fetchAddresses();
  }, [fetchAddresses]);

  // Address form input change
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // Validate address fields required per schema
  function validateAddressForm(): boolean {
    let errs: { [k: string]: string } = {};
    if (!addressForm.fullName.trim()) errs.fullName = 'Required';
    if (!addressForm.phone.trim()) errs.phone = 'Required';
    if (!addressForm.line1.trim()) errs.line1 = 'Required';
    if (!addressForm.city.trim()) errs.city = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmitAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAddressForm()) {
      toast.error('Please fix errors before submitting.');
      return;
    }

    try {
      // Explicitly pick the required fields for AddressCreateInput
      const {
        fullName,
        label,
        phone,
        whatsappNumber,
        line1,
        line2,
        city,
        area,
        state,
        postalCode,
        country,
        isDefault,
      } = addressForm;

      const cleanAddress = {
        fullName: fullName.trim(),
        label: label.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        line1: line1.trim(),
        line2: line2.trim(),
        city: city.trim(),
        area: area.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };

      const created = await createAddress(cleanAddress);
      toast.success('Address added!');
      setOpen(false);
      setAddressForm({
        fullName: '',
        label: '',
        phone: '',
        whatsappNumber: '',
        line1: '',
        line2: '',
        city: '',
        area: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        isDefault: false,
      });
      await fetchAddresses();
      // Select as the currently selected address if there is one
      if (created && (created as Address).id) {
        setSelectedAddressId((created as Address).id);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error adding address.');
    }
  }

  // Remove debug log or minimize its invocations
  // console.log('Address-page: ', addresses, selectedAddressId);

  return (
    <section className=' max-w-4xl mx-auto p-4 md:py-10 space-y-8 '>
      <div className='flex justify-between items-center'>
        <h2 className='font-semibold text-lg mb-2'>Shipping Address</h2>

        {/* Add address button always shows */}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <PlusIcon
                width={22}
                className='h-4 w-4'
                fill='currentColor'
                strokeWidth={1.5}
                stroke='currentColor'
              />
              <span className='text-sm'>Add Address</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='text-2xl font-medium text-foreground'>
                Add New Address
              </DialogTitle>
            </DialogHeader>
            <form className='flex flex-col gap-2' onSubmit={handleSubmitAddress} autoComplete='off'>
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground' htmlFor='fullName'>
                  Full Name*
                </Label>
                <Input
                  name='fullName'
                  placeholder='Receiver Name'
                  className='w-full'
                  value={addressForm.fullName}
                  onChange={handleFormChange}
                  required
                />
                {errors.fullName && <span className='text-xs text-red-500'>{errors.fullName}</span>}
              </div>
              <div className='flex-1 flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground' htmlFor='phone'>
                  Phone*
                </Label>
                <Input
                  name='phone'
                  placeholder='0300XXXXXXXX'
                  className='w-full'
                  value={addressForm.phone}
                  onChange={handleFormChange}
                  required
                  inputMode='tel'
                />
                {errors.phone && <span className='text-xs text-red-500'>{errors.phone}</span>}
              </div>
              <div className='flex-1 flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground' htmlFor='whatsappNumber'>
                  WhatsApp
                </Label>
                <Input
                  name='whatsappNumber'
                  placeholder='03XXXXXXXXX'
                  className='w-full'
                  value={addressForm.whatsappNumber}
                  onChange={handleFormChange}
                  inputMode='tel'
                />
              </div>

              <div className='flex flex-row gap-2'>
                {/* <div className='flex-1 flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground' htmlFor='label'>
                      Label
                    </Label>
                    <Input
                      name='label'
                      placeholder='Home, Office'
                      className='w-full'
                      value={addressForm.label}
                      onChange={handleFormChange}
                    />
                  </div> */}
                {/* <div className='flex-1 flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground' htmlFor='isDefault'>
                      <span>Set as default</span>
                      <input
                        type='checkbox'
                        name='isDefault'
                        checked={addressForm.isDefault}
                        onChange={handleFormChange}
                        className='ml-2 scale-125 align-middle'
                      />
                    </Label>
                  </div> */}
              </div>
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground' htmlFor='line1'>
                  Address Line 1*
                </Label>
                <Input
                  name='line1'
                  placeholder='e.g. Flat #, Floor, Building'
                  className='w-full'
                  value={addressForm.line1}
                  onChange={handleFormChange}
                  required
                />
                {errors.line1 && <span className='text-xs text-red-500'>{errors.line1}</span>}
              </div>
              <div className='flex flex-row gap-2'>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='line2'>
                    Address Line 2
                  </Label>
                  <Input
                    name='line2'
                    placeholder='(optional)'
                    className='w-full'
                    value={addressForm.line2}
                    onChange={handleFormChange}
                  />
                </div>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='area'>
                    Area
                  </Label>
                  <Input
                    name='area'
                    placeholder='Johar, Gulshan, etc.'
                    className='w-full'
                    value={addressForm.area}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className='flex flex-row gap-2'>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='city'>
                    City*
                  </Label>
                  <Input
                    name='city'
                    placeholder='Karachi'
                    className='w-full'
                    value={addressForm.city}
                    onChange={handleFormChange}
                    required
                  />
                  {errors.city && <span className='text-xs text-red-500'>{errors.city}</span>}
                </div>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='state'>
                    State
                  </Label>
                  <Input
                    name='state'
                    placeholder='Sindh'
                    className='w-full'
                    value={addressForm.state}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className='flex flex-row gap-2'>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='country'>
                    Country*
                  </Label>
                  <Input
                    name='country'
                    placeholder='Pakistan'
                    className='w-full'
                    value={addressForm.country}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className='flex-1 flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground' htmlFor='postalCode'>
                    Postal Code
                  </Label>
                  <Input
                    name='postalCode'
                    placeholder='(optional)'
                    className='w-full'
                    value={addressForm.postalCode}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <Button
                type='submit'
                variant='default'
                className='w-full mt-1'
                aria-label='Save Address'
              >
                <SendIcon width={24} className='h-4 w-4' strokeWidth={1.5} stroke='currentColor' />
                Save Address
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {addressLoading ? (
        <>
          <div className='space-y-2 mb-2 animate-pulse'>
            {[...Array(1)].map((_, idx) => (
              <div
                key={idx}
                className='border border-gray-200 rounded-md p-3 flex items-center gap-4 bg-gray-50'
              >
                <div className='rounded-full bg-gray-200 h-5 w-5 mr-2' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-1/3' />
                  <div className='h-3 bg-gray-200 rounded w-2/3' />
                  <div className='h-3 bg-gray-100 rounded w-1/4' />
                </div>
                <div className='ml-auto h-3 w-12 bg-gray-200 rounded' />
              </div>
            ))}
          </div>
        </>
      ) : !addressLoading && addresses.length === 0 ? (
        <div className='text-gray-500 p-2'>No addresses found. Please add one.</div>
      ) : (
        <ul className='space-y-2 mb-2'>
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className={`border rounded-md p-3 flex items-center gap-4 ${
                selectedAddressId === addr.id ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <input
                type='radio'
                name='address'
                checked={selectedAddressId === addr.id}
                onChange={() => setSelectedAddressId(addr.id)}
                className='accent-primary'
                id={addr.id}
              />
              <label htmlFor={addr.id} className='flex-1 cursor-pointer'>
                <div className='font-medium flex items-center gap-2'>
                  {addr.fullName}
                  {addr.isDefault && (
                    <span className='text-xs rounded bg-green-50 text-green-500 border border-green-200 px-1 py-0.5 ml-2'>
                      Default
                    </span>
                  )}
                </div>
                <div className='text-sm text-gray-600'>
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}
                  {addr.area ? `, ${addr.area}` : ''}, {addr.city}
                  {addr.state ? `, ${addr.state}` : ''}, {addr.country}
                  {addr.postalCode ? `, ${addr.postalCode}` : ''}
                </div>
                <div className='text-xs text-gray-500'>Phone: {addr.phone}</div>
                {addr.whatsappNumber && (
                  <div className='text-xs text-green-600'>WhatsApp: {addr.whatsappNumber}</div>
                )}
              </label>
              {addr.label && (
                <span className='ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-xs'>
                  {addr.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
