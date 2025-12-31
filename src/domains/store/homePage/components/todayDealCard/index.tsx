import Link from 'next/link';

// import { TodayDeals } from "@/domains/product/constants";

import TodayDealCard from './TodayDealCard';
import { ArrowRight } from 'lucide-react';
import { TodaysDealType } from '@/actions/landing-dashboard/dashboard';

export const TodayDealCards = ({ TodayDeals }: { TodayDeals: TodaysDealType[] | undefined }) => {
  console.log('todays deals:', TodayDeals);

  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-foreground'>Today&apos;s Deals</h2>
      </div>
      <div
        className={`flex justify-between gap-3.5 pb-7 2xl:pb-0 ${
          //   TodayDeals?.length! > 0 &&
          ' overflow-x-scroll [&::-webkit-scrollbar]:h-1  ::-webkit-scrollbar-track]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:bg-foreground/20 '
        } `}
      >
        {TodayDeals?.map((deal, index) => {
          const path1 = deal.images?.[0]?.path;
          const path2 = deal.images?.[1]?.path;
          console.log('TodayDealCard', path1, path2, deal?.productVariants[0]);
          return (
            <TodayDealCard
              productDescription={deal.description ?? ''}
              productName={deal.title}
              oldPrice={+deal.basePrice!}
              newPrice={deal?.salePrice!}
              image={[path1!, path2!]}
              spec={
                deal?.productVariants[deal?.id as any]?.options.map((option) => ({
                  name: option.option.name,
                  value: option.option.value ?? 'N/A' ?? null,
                })) ?? ([] as { name: string; value: string | null }[])
              }
              dealEndTime={deal?.endsAt!}
              //   new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              url={`/shop/${deal.slug}`}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
};
