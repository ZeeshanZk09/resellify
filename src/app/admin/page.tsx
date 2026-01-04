import { getAdminDashboard, getStoreDashboard } from '@/actions/admin/dashboard';
import OrdersAreaChart from '@/shared/components/OrdersAreaChart';
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import ViewProduct from './_components/view-product';
import ViewsReport from './_components/views-report';

export default async function AdminDashboard() {
  const { data } = await getAdminDashboard();
  const { data: dashboardData } = await getStoreDashboard();
  console.log('admin dashboard: ', data);
  const cards = [
    { title: 'Total Products', value: data?.products, icon: ShoppingBasketIcon },
    { title: 'Total Revenue', value: `Rs${data?.revenue}`, icon: CircleDollarSignIcon },
    { title: 'Total Orders', value: data?.orders, icon: TagsIcon },
    {
      title: 'Total Ratings',
      value: dashboardData?.ratings.length,
      icon: StarIcon,
    },
  ];

  return (
    <section className='w-full min-h-screen flex flex-col items-start gap-10'>
      <div className='flex flex-col items-start text-foreground/80'>
        <h1 className='text-2xl mb-10'>
          Admin <span className='text-foreground font-medium'>Dashboard</span>
        </h1>

        {/* Cards */}
        <div className='flex flex-wrap sm:flex-nowrap gap-5 my-10 mt-4 w-full'>
          {cards?.map((card, index) => (
            <div
              key={index}
              className='w-full flex items-stretch sm:items-center gap-10 border border-foreground/20 p-3 px-6 rounded-lg'
            >
              <div className='flex flex-col gap-3 text-xs'>
                <p>{card.title}</p>
                <b className='text-2xl font-medium text-foreground/60'>{card.value}</b>
              </div>
              <card.icon
                size={50}
                className=' w-11 h-11 p-2.5 text-card bg-card-foreground rounded-full'
              />
            </div>
          ))}
        </div>

        {/* visits report */}

        <ViewsReport />

        {/* Area Chart */}
        <OrdersAreaChart allOrders={data?.allOrders!} />
      </div>
      <hr className='w-full' />
      <div className=' text-foreground/80 mb-28'>
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
                    return (
                      <p key={cat.categoryId} className='text-slate-400'>
                        {cat.categoryId}
                      </p>
                    );
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
                <ViewProduct slug={review?.product?.slug!} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
