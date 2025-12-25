// import { CollectionsData } from "../../constants";

import { CollectionType } from '@/actions/landing-dashboard/dashboard';
import CollectionCard from './collectionCard';

export const CollectionCards = ({
  CollectionsData,
}: {
  CollectionsData: CollectionType[] | undefined;
}) => {
  return (
    <div className='w-full mt-14'>
      <div className='flex w-full justify-between items-center mb-7'>
        <h2 className='text-2xl font-medium text-foreground'>Collections</h2>
      </div>
      <div
        className={`flex justify-between gap-3.5 ${
          CollectionsData?.length! > 0 &&
          'overflow-x-scroll [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20'
        }`}
      >
        {CollectionsData?.map((collection, index) => (
          <CollectionCard collection={collection} key={index} />
        ))}
      </div>
    </div>
  );
};
