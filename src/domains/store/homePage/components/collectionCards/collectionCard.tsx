import Image from "next/image";
import Link from "next/link";
import type { CollectionType } from "@/actions/landing-dashboard/dashboard";

// import { TCollectionCard } from "../../types";

type TProps = {
  collection: CollectionType;
};

const CollectionCard = ({ collection }: TProps) => {
  console.log("collection in CollectionCard: ", collection);
  // Safer & clearer: ensure every level exists before accessing
  const anyImageExistsOnAnyCatOrSubCat =
    Array.isArray(collection?.products) &&
    collection.products.some(
      (p) =>
        Array.isArray(p?.product?.images) &&
        p.product.images.some((i) => Boolean(i?.path)),
    );
  const anyImagePath = (() => {
    if (!anyImageExistsOnAnyCatOrSubCat) return undefined;
    for (const p of collection.products) {
      const img = p?.product?.images?.find((i) => Boolean(i?.path));
      if (img) return img.path;
    }
    return undefined;
  })();
  return (
    <div className="min-w-sm h-[250px] flex space-x-2 relative rounded-xl bg-card overflow-hidden mb-5">
      <div className="flex-grow-2 ml-[30px]">
        <h2 className="text-card-foreground mb-3 mt-7 font-medium">
          {collection.name}
        </h2>
        <div className="max-h-[50%] overflow-x-auto [&::-webkit-scrollbar]:w-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20">
          {collection.children.map((child) => (
            <Link
              href={`/category/${collection.slug}/${child.slug}`}
              key={child.id}
              className=" block relative text-sm leading-6 text-card-foreground/70 z-2"
            >
              {child.name}
            </Link>
          ))}
        </div>
      </div>
      {anyImageExistsOnAnyCatOrSubCat && (
        <div className="absolute top-2 right-3.5 w-[140px] h-[180px] z-1">
          <Image
            src={anyImagePath!}
            alt={collection.name}
            fill
            sizes="(max-width:140px)"
            className="object-cover rounded-2xl"
          />
        </div>
      )}
      <Link
        href={`/category/${collection.slug}`}
        className="w-auto absolute right-5 bottom-5 pr-5 text-sm font-medium text-card-foreground/70 bg-[url('/icons/arrowIcon01.svg')] bg-no-repeat bg-position-[right_center] hover:font-medium hover:text-card-foreground"
      >{`All ${collection.name}`}</Link>
    </div>
  );
};

export default CollectionCard;
