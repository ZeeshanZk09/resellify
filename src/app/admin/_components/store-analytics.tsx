import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from 'lucide-react';
import Image from 'next/image';
import ViewProduct from './view-product';
import { getStoreDashboard } from '@/actions/admin/dashboard';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
export default async function StoreAnalytics() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
  let dashboardData;
  const data = await getStoreDashboard();
  if (data !== false) {
    dashboardData = data;
  }

  let dashboardCardsData = [
    { title: 'Total Products', value: dashboardData?.totalProducts, icon: ShoppingBasketIcon },
    {
      title: 'Total Earnings',
      value: `${currency}${dashboardData?.totalEarnings}`,
      icon: CircleDollarSignIcon,
    },
    { title: 'Total Orders', value: dashboardData?.totalOrders, icon: TagsIcon },
    { title: 'Total Ratings', value: dashboardData?.ratings.length, icon: StarIcon },
  ];

  return (
    <div className=' text-slate-500 mb-28'>
      <h1 className='text-2xl'>
        Store <span className='text-slate-800 font-medium'>Dashboard</span>
      </h1>

      <div className='flex flex-wrap gap-5 my-10 mt-4'>
        {dashboardCardsData?.map((card, index) => (
          <div
            key={index}
            className='flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg'
          >
            <div className='flex flex-col gap-3 text-xs'>
              <p>{card.title}</p>
              <b className='text-2xl font-medium text-slate-700'>{card.value}</b>
            </div>
            <card.icon
              size={50}
              className=' w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full'
            />
          </div>
        ))}
      </div>

      <h2>Total Reviews</h2>

      <div className='mt-5'>
        {dashboardData?.ratings.map((review, index) => (
          <div
            key={index}
            className='flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl'
          >
            <div>
              <div className='flex gap-3'>
                <Avatar className='size-9'>
                  <AvatarFallback className='uppercase'>
                    {(review?.user?.name as string)?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{review.user?.name! as string}</p>
                  <p className='font-light text-slate-500'>
                    {new Date(review.createdAt as Date).toDateString()}
                  </p>
                </div>
              </div>
              <p className='mt-3 text-slate-500 max-w-xs leading-6'>{review.comment}</p>
            </div>
            <div className='flex flex-col justify-between gap-6 sm:items-end'>
              <div className='flex flex-col sm:items-end'>
                {review.product?.categories.map((cat) => {
                  return <p className='text-slate-400'>{cat.categoryId}</p>;
                })}
                <p className='font-medium'>{review.product?.title as string}</p>
                <div className='flex items-center'>
                  {Array(5)
                    .fill('')
                    .map((_, index) => (
                      <StarIcon
                        key={index}
                        size={17}
                        className='text-transparent mt-0.5'
                        fill={review.rating >= index + 1 ? '#00C950' : '#D1D5DB'}
                      />
                    ))}
                </div>
              </div>
              <ViewProduct slug={review.product.slug} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
