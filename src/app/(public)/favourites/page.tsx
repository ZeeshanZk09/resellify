import { getFavProducts } from '@/actions/favourite';
import Link from 'next/link';

export const revalidate = 0;

export default async function Favourites() {
  const favs = (await getFavProducts())?.favs!;
  if (favs?.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-96 text-gray-500'>
        <p className='text-xl'>You haven't liked any products yet.</p>
        <p className='text-sm mt-2'>Explore and like products to see them here.</p>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Your Favourites</h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
        {favs?.map((product) => (
          <div
            key={product.id}
            className='max-w-sm border rounded-lg p-4 hover:shadow-lg transition cursor-pointer'
          >
            <Link href={`/shop/${product?.product?.slug}`}>
              <img
                src={product?.product?.images?.[0]?.path}
                alt={product?.product?.title}
                className='w-full h-40 object-cover rounded mb-3'
              />
              <h2 className='font-semibold text-lg'>{product?.product?.title}</h2>
              <p className=' truncate'>{product.product.description}</p>
              {product?.product?.salePrice &&
              product.product.salePrice < product.product.basePrice ? (
                <div className='flex items-center gap-2'>
                  <span className='text-gray-400 line-through'>
                    ${product.product.basePrice.toFixed(2)}
                  </span>
                  <span className='text-red-600 font-semibold'>
                    ${product.product.salePrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className='text-gray-700'>${product?.product?.basePrice?.toFixed(2)}</p>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
