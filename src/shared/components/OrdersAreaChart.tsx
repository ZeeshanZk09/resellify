'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function OrdersAreaChart({
  allOrders,
}: {
  allOrders:
    | {
        totalAmount: Number;
        createdAt: Date;
      }[]
    | undefined;
}) {
  // Group orders by date
  const ordersPerDay =
    allOrders?.reduce<Record<string, number>>((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]; // format: YYYY-MM-DD
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {}) ?? {};
  const chartData = Object.entries(ordersPerDay).map(([date, count]) => ({
    date,
    orders: count,
  }));

  return (
    <div className='w-full px-2 pb-4 text-xs'>
      <h3 className='text-lg sm:text-xl font-semibold text-foreground mb-4 pt-2 flex justify-between items-center'>
        <span>
          <span className='text-foreground/80 font-medium'>Orders</span>
          <span className='mx-1 text-primary'>/</span>
          <span className='text-foreground/60'>Day</span>
        </span>
        <span className='text-[10px] sm:text-xs italic text-foreground/40'>
          Last {chartData.length} days
        </span>
      </h3>
      <ResponsiveContainer width='100%' aspect={2.5}>
        <AreaChart data={chartData} margin={{ top: 16, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id='ordersColor' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#6366f1' stopOpacity={0.4} />
              <stop offset='60%' stopColor='#6366f1' stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 6' stroke='#e0e7ef' vertical={false} />
          <XAxis
            dataKey='date'
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(date) => {
              // Show short date on small screens
              const d = new Date(date);
              return window.innerWidth < 600
                ? `${d.getMonth() + 1}/${d.getDate()}`
                : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            width={40}
            label={{
              value: 'Orders',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
              fill: '#64748b',
            }}
            padding={{ top: 10, bottom: 10 }}
          />
          <Tooltip
            wrapperClassName='!rounded-md !shadow-lg'
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#222',
              fontSize: '12px',
              padding: '10px',
            }}
            labelStyle={{
              color: '#6366f1',
              fontWeight: 500,
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
            formatter={(value: any) => [`${value} Orders`, '']}
            labelFormatter={(label) =>
              `Date: ${new Date(label).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}`
            }
          />
          <Area
            type='monotone'
            dataKey='orders'
            stroke='#6366f1'
            fill='url(#ordersColor)'
            strokeWidth={2}
            dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
