import type { CategoryOffer } from "@/actions/landing-dashboard/dashboard";
import { WideCard } from "./WideCard";

type TProps = {
  cards: CategoryOffer[] | undefined;
};

export const WideCardRow = ({ cards }: TProps) => {
  if (!cards || cards.length === 0) return null;
  return (
    <div className="w-full mt-15 flex flex-col gap-4 md:flex-row ">
      {cards?.map((card, idx) => {
        const { category, offers, maxDiscount } = card;

        // Only use the newest 6 offers (by offer->startsAt descending; fallback to createdAt if needed)
        const _offers = Array.isArray(offers) ? offers : [];
        const newestOffers = _offers
          .slice()
          .sort((a, b) => {
            const aStarts =
              a.offer && a.offer.startsAt
                ? new Date(a.offer.startsAt).getTime()
                : 0;
            const bStarts =
              b.offer && b.offer.startsAt
                ? new Date(b.offer.startsAt).getTime()
                : 0;
            return bStarts - aStarts;
          })
          .slice(0, 6);

        // Use the first of the newest offers to get an image
        let imgUrl = "/placeholder-card.jpg";
        if (newestOffers.length > 0) {
          // According to CategoryOffer type, each offer.product has .images (may be empty)
          const firstProduct = newestOffers[0].product;
          if (
            firstProduct &&
            Array.isArray(firstProduct.images) &&
            firstProduct.images.length > 0 &&
            firstProduct.images[0]?.path
          ) {
            imgUrl = firstProduct.images[0].path;
          }
        }

        // Small title: Save up to XXRs
        const discountText = maxDiscount
          ? `Save Up to ${Math.round(Number(maxDiscount))}Rs`
          : "";

        // Title: the category name
        const title = category?.name || "Deals";

        // URL: link to category deals
        const url = category?.slug ? `/categories/${category.slug}` : "#";

        return (
          <WideCard
            key={`${idx}-${category?.id}`}
            imgUrl={imgUrl}
            smallTitle={discountText}
            title={title}
            url={url}
          />
        );
      })}
    </div>
  );
};
