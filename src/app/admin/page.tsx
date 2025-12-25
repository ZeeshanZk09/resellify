import { getAdminDashboard } from '@/actions/admin/dashboard';
import OrdersAreaChart from '@/shared/components/OrdersAreaChart';
import { CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon } from 'lucide-react';
import StoreAnalytics from './_components/store-analytics';

export default async function AdminDashboard() {
  const { data } = await getAdminDashboard();
  const cards = [
    { title: 'Total Products', value: data?.products, icon: ShoppingBasketIcon },
    { title: 'Total Revenue', value: `Rs${data?.revenue}`, icon: CircleDollarSignIcon },
    { title: 'Total Orders', value: data?.orders, icon: TagsIcon },
  ];
  return (
    <section className='flex flex-col gap-10 items-start'>
      <div className='text-slate-500'>
        <h1 className='text-2xl'>
          Admin <span className='text-slate-800 font-medium'>Dashboard</span>
        </h1>

        {/* Cards */}
        <div className='flex flex-wrap gap-5 my-10 mt-4'>
          {cards?.map((card, index) => (
            <div
              key={index}
              className='flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg'
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

        {/* Area Chart */}
        <OrdersAreaChart allOrders={data?.allOrders!} />
      </div>
      <StoreAnalytics />
    </section>
  );
}
