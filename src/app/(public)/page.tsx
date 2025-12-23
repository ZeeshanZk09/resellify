import {
  CollectionCards,
  CompanyLogoList,
  HomeCategoryList,
  HomeSlider,
  LatestBlogPosts,
  TodayDealCards,
  TopSellingProductsList,
  WideCardRow,
} from '@/domains/store/homePage/components';
import { threeSaleCards, twoSaleCards } from '@/domains/store/homePage/constants';
export default async function Home() {
  return (
    <div className='w-full bg-mint-500 flex flex-col justify-between max-w-7xl px-5 mx-auto'>
      <div className='storeContainer flex-col'>
        <div className='flex w-full mt-20'>
          <HomeCategoryList />
          <HomeSlider />
        </div>
        <WideCardRow cards={threeSaleCards} />
        <TodayDealCards />
        <WideCardRow cards={twoSaleCards} />
        <CollectionCards />
        <TopSellingProductsList />
        <LatestBlogPosts />
        <CompanyLogoList />
      </div>
    </div>
  );
}
