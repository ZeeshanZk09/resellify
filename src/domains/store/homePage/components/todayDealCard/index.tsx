import Link from "next/link";

import { TodayDeals } from "@/domains/product/constants";

import TodayDealCard from "./TodayDealCard";
import { ArrowRight } from "lucide-react";

export const TodayDealCards = () => {
  return (
    <div className="w-full mt-14">
      <div className="flex w-full justify-between items-center mb-7">
        <h2 className="text-2xl font-medium text-foreground">
          Today&apos;s Deals
        </h2>
        <Link
          href={""}
          className="flex gap-3 font-medium hover:pr-5 pr-6 text-foreground  text-sm transition-all duration-300 ease-out"
        >
          <span>view all</span>
          <ArrowRight size={18} />
        </Link>
      </div>
      <div
        className="flex justify-between gap-3.5 overflow-x-scroll pb-7 2xl:pb-0 [&::-webkit-scrollbar]:h-1
  [&::-webkit-scrollbar-track]:bg-foreground/20
  [&::-webkit-scrollbar-thumb]:bg-foreground/20 "
      >
        {TodayDeals.map((deal, index) => (
          <TodayDealCard
            productName={deal.name}
            oldPrice={+deal.price}
            newPrice={deal.dealPrice}
            image={[deal.images?.[0].path, deal.images?.[1].path]}
            spec={deal.specs.map((spec) => spec?.values?.join(", "))}
            dealEndTime={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
            url={deal.url}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};
