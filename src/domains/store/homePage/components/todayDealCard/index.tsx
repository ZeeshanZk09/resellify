// import { TodayDeals } from "@/domains/product/constants";

import type { TodaysDealType } from "@/actions/landing-dashboard/dashboard";
import { cn } from "@/shared/lib/utils";
import TodayDealCard from "./TodayDealCard";

export const TodayDealCards = ({
  TodayDeals,
}: {
  TodayDeals: TodaysDealType[] | undefined;
}) => {
  return (
    <div className="w-full mt-14">
      <div className="flex w-full justify-between items-center mb-7">
        <h2 className="text-2xl font-medium text-foreground">
          Today&apos;s Deals
        </h2>
      </div>
      <div
        className={cn(
          `flex gap-3.5 pb-7`,
          "overflow-x-scroll [&::-webkit-scrollbar]:h-0"
        )}
      >
        {TodayDeals?.map((deal) => {
          const path1 = deal.images?.[0];
          const path2 = deal.images?.[1];
          console.log("image in toadys deal card: ", path1, path2);
          console.log("deals: ", TodayDeals);

          // console.log("TodayDealCard", path1, path2, deal?.productVariants[0]);
          console.log(
            "productDescription: ",
            deal?.description || undefined,
            deal?.shortDescription!
          );

          return (
            <TodayDealCard
              className="w-[18rem] shrink-0"
              locale={deal?.locale! || "en"}
              currencySymbol={deal?.currency! || "PKR"}
              visibility={deal?.visibility || "PRIVATE"}
              productDescription={deal?.description || deal?.shortDescription!}
              productName={deal?.title}
              oldPrice={+deal?.basePrice!}
              newPrice={deal?.salePrice!}
              image={path1 && path2 ? [path1!, path2!] : undefined}
              spec={
                deal?.productVariants[deal?.id as any]?.options.map(
                  (option) => ({
                    name: option.option.name,
                    value: option.option.value ?? "N/A",
                  })
                ) ?? ([] as { name: string; value: string | null }[])
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
