'use client';
import Link from 'next/link';

// import { TodayDeals } from "@/domains/product/constants";

import TodayDealCard from './TodayDealCard';
import { ArrowRight } from 'lucide-react';
import { TodaysDealType } from '@/actions/landing-dashboard/dashboard';
import { cn } from '@/shared/lib/utils';
import { useMobile } from '@/shared/utils/useMobile';

export const TodayDealCards = ({ TodayDeals }: { TodayDeals: TodaysDealType[] | undefined }) => {
  console.log('todays deals:', TodayDeals?.length);
  const isMobile = useMobile();
  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-foreground'>Today&apos;s Deals</h2>
      </div>
      <div
        className={cn(
          'flex justify-between gap-3.5 pb-7',
          'overflow-x-scroll [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20'
        )}
      >
        {TodayDeals?.map((deal) => {
          const path1 = deal.images?.[0];
          const path2 = deal.images?.[1];
          console.log('TodayDealCard', path1, path2, deal?.productVariants[0]);
          return (
            <TodayDealCard
              visibility={deal.visibility}
              productDescription={deal.description ?? ''}
              productName={deal.title}
              oldPrice={+deal.basePrice!}
              newPrice={deal?.salePrice!}
              image={[path1!, path2!]}
              spec={
                deal?.productVariants[deal?.id as any]?.options.map((option) => ({
                  name: option.option.name,
                  value: option.option.value ?? 'N/A',
                })) ?? ([] as { name: string; value: string | null }[])
              }
              dealEndTime={deal?.endsAt!}
              //   new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              url={`/shop/${deal.slug}`}
              key={deal.id + Math.random()}
            />
          );
        })}
      </div>
    </div>
  );
};
