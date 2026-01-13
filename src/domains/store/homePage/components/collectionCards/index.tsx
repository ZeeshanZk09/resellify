import type { CollectionType } from "@/actions/landing-dashboard/dashboard";
import CollectionCard from "./collectionCard";

export const CollectionCards = ({
  CollectionsData,
}: {
  CollectionsData: CollectionType[] | undefined;
}) => {
  return (
    <div className="mt-14">
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-medium text-foreground">Collections</h2>
      </div>
      {/* Only the cards container scrolls, not the whole page */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20">
        <div
          className={`flex gap-3.5 ${
            CollectionsData?.length! > 4 &&
            "overflow-x-scroll [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20"
          }`}
        >
          {CollectionsData?.map((collection, index) => (
            <CollectionCard collection={collection} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
