import Link from 'next/link';

import ProductCard from '@/domains/product/components/productCard';
import { TopSellingProductType } from '@/actions/landing-dashboard/dashboard';
// import {  } from "@/domains/product/constants";

export const TopSellingProductsList = ({
  TopProducts,
}: {
  TopProducts: TopSellingProductType[];
}) => {
  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-foreground'>Top Selling Products</h2>
        <Link href={'/'}>view all</Link>
      </div>
      <div
        className={`flex justify-between gap-3 pb-7 2xl:pb-0 ${
          TopProducts.length > 0 &&
          'overflow-x-scroll [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:bg-foreground/20'
        }`}
      >
        {TopProducts.length > 0 &&
          TopProducts?.map((product, index) => (
            <ProductCard
              name={product?.title}
              images={product.imgUrl}
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
