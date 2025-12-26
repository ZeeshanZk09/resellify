import Link from 'next/link';

// import { TodayDeals } from "@/domains/product/constants";

import TodayDealCard from './TodayDealCard';
import { ArrowRight } from 'lucide-react';
import { TodaysDealType } from '@/actions/landing-dashboard/dashboard';

export const TodayDealCards = ({ TodayDeals }: { TodayDeals: any[] | undefined }) => {
  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-foreground'>Today&apos;s Deals</h2>
      </div>
      <div
        className={`flex justify-between gap-3.5 pb-7 2xl:pb-0 ${
          TodayDeals?.length! > 0 &&
          'overflow-x-scroll [&::-webkit-scrollbar]:h-1  ::-webkit-scrollbar-track]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:bg-foreground/20'
        } `}
      >
        {TodayDeals?.map((deal, index) => (
          <TodayDealCard
            productName={deal.title}
            oldPrice={+deal.price!}
            newPrice={deal?.salePrice!}
            image={[deal.images?.[0].path, deal.images?.[1].path]}
            spec={deal.spec.map((spec: any) => spec?.values?.join(', '))}
            dealEndTime={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
            url={deal.url}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};
