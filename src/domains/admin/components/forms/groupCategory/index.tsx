'use client';

import { TAddCategory } from '@/actions/category/category';
import Input from '@/shared/components/ui-v2/input';

type TProps = {
  errorMsg: string | undefined;
  data: TAddCategory;
  onChange: (data: TAddCategory) => void;
};

const GroupCategory = ({ errorMsg, data, onChange }: TProps) => {
  return (
    <div className='grid grid-cols-3 text-gray-500 gap-y-4 items-center my-6 mx-4 text-sm'>
      <span>Category Group Name:</span>
      <Input
        className='col-span-2 w-[200px]'
        name='name'
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.currentTarget.value })}
        type='text'
        placeholder='Category name (min 3 characters)...'
        required
      />
      <span>Description:</span>
      <Input
        className='col-span-2 w-[200px]'
        name='description'
        onChange={(e) => onChange({ ...data, description: e.currentTarget.value || undefined })}
        type='text'
        placeholder='Description (optional)...'
        value={data.description || ''}
      />
      {errorMsg !== '' && <span className='col-span-3 text-bitex-red-500'>{errorMsg}</span>}
    </div>
  );
};

export default GroupCategory;
