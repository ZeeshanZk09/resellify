import { getHome } from '@/actions/landing-dashboard/dashboard';
import {
  CollectionCards,
  CompanyLogoList,
  HomeCategoryList,
  HomeSlider,
  TodayDealCards,
  TopSellingProductsList,
  WideCardRow,
} from '@/domains/store/homePage/components';
// import { threeSaleCards, twoSaleCards } from '@/domains/store/homePage/constants';

export const revalidate = 0; // Revalidate data on every request for real-time updates

export default async function Home() {
  const { topSellingProducts, todaysDeals, offers, error, details, collections, brands } =
    await getHome();

  return (
    <div className='w-full bg-mint-500 flex flex-col justify-between max-w-7xl px-5 mx-auto'>
      <div className='storeContainer flex-col'>
        <div className='flex w-full mt-10'>
          <HomeCategoryList />
          <HomeSlider />
        </div>
        <WideCardRow cards={offers as any} />
        <TodayDealCards TodayDeals={todaysDeals as any} />
        <CollectionCards CollectionsData={collections} />
        <TopSellingProductsList TopProducts={topSellingProducts as any} />

        <CompanyLogoList COMPANIES_LOGOS={brands} />
      </div>
    </div>
  );
}
