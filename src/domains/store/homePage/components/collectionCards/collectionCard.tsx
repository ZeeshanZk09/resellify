import Image from "next/image";
import Link from "next/link";

import { TCollectionCard } from "../../types";

type TProps = {
  collection: TCollectionCard;
};

const CollectionCard = ({ collection }: TProps) => {
  return (
    <div className="min-w-sm h-[250px] flex space-x-2 relative rounded-xl bg-card overflow-hidden mb-5">
      <div className="flex-grow-2 ml-[30px]">
        <h2 className="text-card-foreground mb-3 mt-7 font-medium">
          {collection.name}
        </h2>
        {collection.collections.map((collection, index) => (
          <Link
            href={collection.url}
            key={index}
            className=" block relative text-sm leading-6 text-card-foreground/70 z-[2]"
          >
            {collection.label}
          </Link>
        ))}
      </div>
      <div className="absolute top-2 right-3.5 w-[140px] h-[180px] z-[1]">
        <Image
          src={collection.imgUrl}
          alt={collection.name}
          fill
          sizes="(max-width:140px)"
          className="object-cover rounded-2xl"
        />
      </div>
      <Link
        href={collection.url}
        className="w-auto absolute right-5 bottom-5 pr-5 text-sm font-medium text-card-foreground/70 bg-[url('/icons/arrowIcon01.svg')] bg-no-repeat bg-[position:right_center] hover:font-medium hover:text-card-foreground"
      >{`All ${collection.name}`}</Link>
    </div>
  );
};

export default CollectionCard;
