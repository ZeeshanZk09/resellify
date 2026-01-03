'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import { Order } from '@/shared/lib/generated/prisma/browser';

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch user orders from API
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch('/api/orders', {
          method: 'GET',
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const { orders: orderList } = await res.json();
        setOrders(orderList);
      } catch (err: any) {
        setOrders([]);
        toast.error(err?.message || 'Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-10 gap-3'>
        <Loader className='animate-spin text-gray-400' size={32} />
        <p className='text-gray-500'>Loading your orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className='max-w-2xl mx-auto p-6 flex flex-col items-center'>
        <ShoppingBag size={38} className='text-primary mb-2' />
        <h1 className='text-xl font-semibold mb-2'>No Orders Yet</h1>
        <p className='mb-4 text-gray-500 text-center'>
          Looks like you have not placed any orders yet.
        </p>
        <Button onClick={() => router.push('/')}>Go Shopping</Button>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl md:text-3xl font-bold mb-6 flex gap-3 items-center'>
        <ShoppingBag size={28} />
        My Orders
      </h1>
      <div className='space-y-8'>
        {orders.map((order) => (
          <div key={order.id} className='bg-white shadow rounded-lg p-5 border border-gray-100'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
              <div className='text-primary font-semibold text-sm'>#{order.orderNumber}</div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'DELIVERED'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-700'
                    : order.status === 'CREATED'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {order.status}
              </span>
              <span className='text-xs text-gray-400'>{order?.placedAt?.toLocaleDateString()}</span>
            </div>
            {/* ORDER ITEMS */}
            <div className='divide-y'>
              {order?.item?.map((item) => (
                <div key={item.id} className='flex py-3 gap-4 items-center'>
                  <div className='flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center'>
                    {item.product.images?.[0]?.path ? (
                      <Image
                        src={item.product.images[0].path}
                        alt={item.product.title}
                        className='object-cover'
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className='w-full h-full bg-gray-200' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>
                      {item.product.title}
                      {item.variant?.title && (
                        <span className='ml-2 text-gray-500 text-sm'>({item.variant.title})</span>
                      )}
                    </div>
                    {item.sku && <div className='text-xs text-gray-400'>SKU: {item.sku}</div>}
                    <div className='text-xs text-gray-500 mt-1'>
                      Quantity: <span className='font-semibold'>{item.quantity}</span>
                    </div>
                  </div>
                  <div className='text-right min-w-[80px]'>
                    <div className='font-semibold text-gray-800'>
                      PKR {item.price?.toLocaleString()}
                    </div>
                    <div className='text-xs text-gray-400'>{`Total: PKR ${item.lineTotal?.toLocaleString()}`}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* ORDER SUMMARY */}
            <div className='flex flex-wrap items-center justify-between gap-2 mt-4 border-t pt-3'>
              <div>
                <div className='text-xs text-gray-500'>Payment:</div>
                <div className='font-medium text-sm'>{order.paymentMethod}</div>
              </div>
              <div>
                <div className='text-xs text-gray-500'>Order Total:</div>
                <div className='font-bold text-lg text-primary'>
                  PKR {order.totalAmount?.toLocaleString()}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-500'>Shipping Fee</div>
                <div className='text-sm'>PKR {order.shippingFee?.toLocaleString()}</div>
              </div>
              <div>
                <div className='text-xs text-gray-500'>You Saved</div>
                <div className='text-sm text-green-600'>
                  PKR {order.discountAmount?.toLocaleString()}
                </div>
              </div>
            </div>
            {/* Actions (e.g. Details, Track, Invoice, etc.) */}
            <div className='flex gap-2 mt-4 text-sm'>
              <Button size='sm' variant='outline' onClick={() => router.push(`/order/${order.id}`)}>
                View Details
              </Button>
              {/* <Button size="sm" variant="ghost">Track</Button> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
