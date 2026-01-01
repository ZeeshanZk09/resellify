'use client';

import { toggleStock } from '@/actions/product/product';
import { Product } from '@/shared/lib/generated/prisma/client';
import { toast } from 'sonner';

export default function ToggleStock({ product }: { product: Product }) {
  return (
    <td className='px-4 py-3 text-center'>
      <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
        <input
          type='checkbox'
          className='sr-only peer'
          onChange={() =>
            toast.promise(
              toggleStock(product.id, product.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'),
              { loading: 'Updating data...' }
            )
          }
          checked={product.visibility === 'PUBLIC'}
        />
        <div className='w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200'></div>
        <span className='dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4'></span>
      </label>
    </td>
  );
}
