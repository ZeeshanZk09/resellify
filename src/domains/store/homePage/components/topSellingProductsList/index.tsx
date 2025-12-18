import Link from 'next/link';

import ProductCard from '@/domains/product/components/productCard';
import { TopProducts } from '@/domains/product/constants';

export const TopSellingProductsList = () => {
  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-gray-700'>Top Selling Products</h2>
        <Link href={'/'}>view all</Link>
      </div>
      <div
        className='flex justify-between gap-3.5 overflow-x-scroll [&::-webkit-scrollbar]:h-1
  [&::-webkit-scrollbar-track]:bg-foreground/20
  [&::-webkit-scrollbar-thumb]:bg-foreground/20 pb-7 2xl:pb-2 2xl:overflow-x-visible'
      >
        {TopProducts.map((product, index) => (
          <ProductCard
            name={product.name}
            imgUrl={product.imgUrl}
            price={product.price}
            specs={product.specs}
            url={product.url}
            dealPrice={product.dealPrice}
            key={index}
            staticWidth
          />
        ))}
      </div>
    </div>
  );
};
