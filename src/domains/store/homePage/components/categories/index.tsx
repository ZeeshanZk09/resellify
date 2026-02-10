'use client';

import { use, Suspense } from 'react';
import { getAllCategories } from '@/actions/category/category';
import { SK_Box as SkBox } from '@/shared/components/ui-v2/skeleton';
import type { Category } from '@/shared/lib/generated/prisma/browser';
import CategoryListItem from './catListItem';

// Create a stable promise for category fetching
const categoriesPromise = getAllCategories('');

export const HomeCategoryList = () => {
  return (
    <div className='max-w-xs w-[30%] h-125 hidden lg:block bg-card rounded-xl px-6 text-card-foreground shadow-md z-3'>
      <Suspense fallback={<Skeletons />}>
        <CategoryListContent />
      </Suspense>
    </div>
  );
};

const CategoryListContent = () => {
  const data = use(categoriesPromise);
  const categories = ('categories' in data ? (data.categories as Category[]) : []) || [];

  if (categories.length === 0) return null;

  return (
    <ul className='mt-3'>
      {categories.map((item, index) => (
        <CategoryListItem
          key={item.id}
          categoryData={item}
          className={index === categories.length - 1 ? 'border-b-0' : ''}
        />
      ))}
    </ul>
  );
};

const Skeletons = () => {
  const skeletonIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'];
  return (
    <div className='flex flex-col gap-7 justify-center mt-5'>
      {skeletonIds.map((id) => (
        <SkBox key={id} width='100%' height='16px' />
      ))}
    </div>
  );
};
