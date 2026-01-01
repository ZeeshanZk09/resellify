import { getHome } from "@/actions/landing-dashboard/dashboard";
import {
  CollectionCards,
  CompanyLogoList,
  HomeCategoryList,
  HomeSlider,
  TodayDealCards,
  TopSellingProductsList,
  WideCardRow,
} from "@/domains/store/homePage/components";
import { SlidesData } from "@/domains/store/homePage/constants";
// import { threeSaleCards, twoSaleCards } from '@/domains/store/homePage/constants';

export const revalidate = 0; // Revalidate data on every request for real-time updates

export default async function Home() {
  const {
    topSellingProducts,
    todaysDeals,
    offers,
    error,
    details,
    collections,
    brands,
  } = await getHome();

  console.log(
    "HOME: ",
    topSellingProducts,
    todaysDeals,
    offers,
    error,
    details,
    collections,
    brands
  );

  return (
    <div className="w-full bg-mint-500 flex flex-col justify-between max-w-7xl px-5 mx-auto">
      <div className="storeContainer flex-col">
        <div className="flex flex-col sm:flex-row gap-5 mt-5">
          <HomeCategoryList />
          <HomeSlider slides={SlidesData} key={Math.random() * 10000} />
        </div>
        <WideCardRow cards={offers} />
        <TodayDealCards TodayDeals={todaysDeals} />
        <CollectionCards CollectionsData={collections} />
        <TopSellingProductsList TopProducts={topSellingProducts} />
        <CompanyLogoList COMPANIES_LOGOS={brands} />
      </div>
    </div>
  );
}
