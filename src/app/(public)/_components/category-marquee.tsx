'use client';

import { GetCategoriesForMarqueeType } from '@/actions/category/category';
import { use, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesMarqueeProps {
  categoriesPromise: Promise<GetCategoriesForMarqueeType>;
}

const CategoriesMarquee = ({ categoriesPromise }: CategoriesMarqueeProps) => {
  const data = use(categoriesPromise);
  const categories = data.res ?? [];

  const handleSearch = (categoryName: string) => {
    const searchParam = categoryName ? `?search=${categoryName}` : '';
    globalThis.location.href = `/shop${searchParam}`;
  };

  return (
    <div className='overflow-hidden w-full relative max-w-7xl mx-auto select-none group my-2'>
      {/* <div className='absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-linear-to-r from-white to-transparent' /> */}
      <div className='flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:paused gap-4'>
        {categories.map((company) => (
          <button
            key={company.id}
            onClick={() => handleSearch(company.name)}
            className='cursor-pointer whitespace-nowrap p-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300'
          >
            {company.name}
          </button>
        ))}
      </div>
      {/* <div className='absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-linear-to-l from-white to-transparent' /> */}
    </div>
  );
};

export default CategoriesMarquee;
