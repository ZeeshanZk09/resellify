import { Suspense } from "react";
import { getHome } from "@/actions/landing-dashboard/dashboard";
import {
  CollectionCards,
  CompanyLogoList,
  FlashSaleSection,
  HomeCategoryList,
  HomeSlider,
  MarketingFeatures,
  Newsletter,
  RecentlyViewed,
  TodayDealCards,
  TopSellingProductsList,
  TrendingInCity,
  WideCardRow,
} from "@/domains/store/homePage/components";
import { SlidesData } from "@/domains/store/homePage/constants";
import {
  FlashSaleSkeleton,
  ProductGridSkeleton,
} from "@/shared/components/skeletons";
import TrustBadges from "@/shared/components/trust/TrustBadges";
// import { threeSaleCards, twoSaleCards } from '@/domains/store/homePage/constants';

export const revalidate = 0; // Revalidate data on every request for real-time updates

// Mock function to get user's city - replace with actual geolocation
function getUserCity() {
  // TODO: Implement IP geolocation or user preference
  return "Karachi";
}

// Mock function to get flash sales - integrate with your actual data source
async function getFlashSales() {
  // TODO: Query products with active offers that are expiring soon
  // Example query:
  // const flashSales = await prisma.product.findMany({
  //   where: {
  //     productOffers: {
  //       some: {
  //         offer: {
  //           isActive: true,
  //           endsAt: { gt: new Date() }
  //         }
  //       }
  //     }
  //   }
  // })

  return {
    deals: [],
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };
}

// Mock function to get trending products - integrate with Visit analytics
async function getTrendingInCity(city: string) {
  // TODO: Query products with most visits from specified city
  // Example query:
  // const trending = await prisma.product.findMany({
  //   where: {
  //     visits: {
  //       some: { city }
  //     }
  //   },
  //   orderBy: {
  //     visits: { _count: 'desc' }
  //   },
  //   take: 10
  // })

  return [];
}

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

  const userCity = getUserCity();
  const { deals: flashSales, endsAt: flashSaleEndsAt } = await getFlashSales();
  const trendingProducts = await getTrendingInCity(userCity);

  console.log(
    "HOME: ",
    topSellingProducts,
    todaysDeals,
    offers,
    error,
    details,
    collections,
    brands,
  );

  return (
    <div className="bg-mint-500 flex flex-col justify-between max-w-7xl px-5 mx-auto">
      <div className="storeContainer flex-col">
        {/* Hero Section with Categories */}
        <div className="flex flex-col sm:flex-row gap-5 mt-5">
          <HomeCategoryList />
          <HomeSlider slides={SlidesData} key={Math.random() * 10000} />
        </div>

        {/* Trust Badges - Critical for COD users */}
        <TrustBadges className="my-6" />

        {/* Marketing Features */}
        <MarketingFeatures />

        {/* Flash Sales Section - High Priority for Conversion */}
        {flashSales && flashSales.length > 0 && (
          <Suspense fallback={<FlashSaleSkeleton />}>
            <FlashSaleSection
              deals={flashSales}
              endsAt={flashSaleEndsAt}
              title="⚡ Flash Sale"
            />
          </Suspense>
        )}

        {/* Promotional Wide Cards */}
        <WideCardRow cards={offers} />

        {/* Today's Deals */}
        <TodayDealCards TodayDeals={todaysDeals} />

        {/* Trending in Your City - Personalization */}
        {trendingProducts && trendingProducts.length > 0 && (
          <Suspense fallback={<ProductGridSkeleton count={5} />}>
            <TrendingInCity city={userCity} products={trendingProducts} />
          </Suspense>
        )}

        {/* Collections Showcase */}
        <CollectionCards CollectionsData={collections} />

        {/* Top Selling Products */}
        <TopSellingProductsList TopProducts={topSellingProducts} />

        {/* Recently Viewed - Client-side component */}
        <RecentlyViewed />

        {/* Brand Partners */}
        <CompanyLogoList COMPANIES_LOGOS={brands} />

        {/* Newsletter Signup */}
        <Newsletter />
      </div>
    </div>
  );
}
