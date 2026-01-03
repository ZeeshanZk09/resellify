'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { getProductBySlug } from '@/actions/product/product';
import { toast } from 'sonner';
import Image from 'next/image';
import { getAddress } from '@/actions/address';
import { Address } from '@/shared/lib/generated/prisma/browser';
import { Label } from '@/shared/components/ui/label';
import { createOrder } from '@/actions/order';
import { getCartItems } from '@/actions/cart';

// Util for safely getting a numeric value (handles Decimal and string/etc)
function toNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }
  // If it's a Prisma Decimal, it usually has a toNumber or toString
  if (val !== null && typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (typeof val.valueOf === 'function') return Number(val.valueOf());
    if (typeof val.toString === 'function') return Number(val.toString());
  }
  return 0;
}

function formatCurrency(amount: number, currency: string = 'PKR') {
  return `${currency} ${amount.toLocaleString()}`;
}

interface CheckoutItem {
  id: string;
  productId: string;
  title: string;
  image?: string;
  basePrice: number;
  salePrice?: number | null;
  currency: string;
  quantity: number;
  sku?: string;
  variantId?: string;
}

export default function CheckOutScreen() {
  const [cart, setCart] = useState<CheckoutItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(0);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [agree, setAgree] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'JAZZCASH'>('COD');

  const params = useSearchParams();
  const router = useRouter();

  // Safely parse qty with fallback
  const qtyParam = Number(params?.get('qty') || 1);

  useEffect(() => {
    const slug = params?.get('product_slug');
    console.log('slug: ', slug);

    switch (slug) {
      case null:
        getCartItems()
          .then((response) => {
            if (response.message && response.cartItems.length === 0) {
              toast(response.message);
            }
            console.log('response.cartItems: ', response.cartItems);

            // Transform cart items to CheckoutItem, ENSURING basePrice/salePrice are numbers
            const items: CheckoutItem[] = response.cartItems.map((item) => ({
              id: item.id,
              productId: item.productId,
              title: item.product.title,
              image: item.product.images?.[0]?.path,
              basePrice: toNumber(item.product.basePrice),
              salePrice: item.product.salePrice ? toNumber(item.product.salePrice) : null,
              currency: item.product.currency || 'PKR',
              quantity: item.quantity,
              sku: item.product.sku,
              //   variantId: item.product.variantId,
            }));

            setCart(items || []);
            setQuantity(items?.reduce((acc, item) => acc + item.quantity, 0));

            console.log('cart: ', items);
          })
          .catch((err) => {
            console.log(err);
            toast.error(typeof err === 'string' ? err : 'Failed to load cart');
          })
          .finally(() => {
            setProductLoading(false);
          });
        break;

      default:
        getProductBySlug(slug)
          .then(({ res }) => {
            setQuantity(qtyParam);
            if (res) {
              const item: CheckoutItem = {
                id: res.id,
                productId: res.id,
                title: res.title,
                image: res.images?.[0]?.path,
                basePrice: toNumber(res.basePrice),
                salePrice: res.salePrice ? toNumber(res.salePrice) : null,
                currency: res.currency || 'PKR',
                quantity,
                sku: res.sku,
                variantId: res.productVariants?.[0]?.id,
              };
              setCart([item]);
            }
          })
          .catch((err) => {
            console.log(err);
            toast.error(typeof err === 'string' ? err : 'Failed to load product');
          })
          .finally(() => {
            setProductLoading(false);
          });
        break;
    }

    fetchAddresses();
  }, [getCartItems, params, qtyParam]);

  async function fetchAddresses() {
    try {
      const addrList = (await getAddress()) as Address[];
      setAddresses(addrList);
      const chosen = addrList.find((a) => a.isDefault) || addrList[0];
      setSelectedAddressId(chosen?.id || null);
    } catch (e) {
      setAddresses([]);
      setSelectedAddressId(null);
      toast.error('Could not fetch addresses!');
    } finally {
      setAddressLoading(false);
    }
  }

  // Guard against cart not being an array
  const safeCart = Array.isArray(cart) ? cart : [];

  // Use .basePrice and .salePrice always as numbers, computed via toNumber()
  const subTotal = safeCart.reduce((sum, item) => {
    const price = toNumber(item.basePrice) || 0;
    return sum + price * quantity;
  }, 0);

  const shippingFee = 150;

  const discount = safeCart.reduce((sum, item) => {
    const base = toNumber(item.basePrice) || 0;
    const sale = toNumber(item.salePrice) || 0;
    if (base > sale && sale > 0) {
      return sum + (base - sale) * quantity;
    }
    return sum;
  }, 0);

  const total = subTotal + shippingFee - discount;

  const handlePlaceOrder = async () => {
    const slug = params?.get('product_slug');

    if (!selectedAddressId) {
      alert('Please select a shipping address');
      return;
    }
    setIsPlacingOrder(true);

    // Ensure that all values (esp. price) are primitive numbers
    const items = safeCart.map((item) => ({
      cartId: item.id!,
      quantity,
      price: toNumber(item.salePrice) || toNumber(item.basePrice) || 0,
      variantId: item.variantId,
      sku: item.sku,
    }));

    try {
      switch (slug) {
        case null:
          const { error } = await createOrder({
            addressId: selectedAddressId,
            items,
            paymentMethod,
            subTotal,
            shippingFee,
            discountAmount: discount,
          });
          if (error) {
            toast.error(error);
            return;
          }
          break;

        default:
          const { error: e } = await createOrder(
            {
              addressId: selectedAddressId,
              items,
              paymentMethod,
              subTotal,
              shippingFee,
              discountAmount: discount,
            },
            cart[0].productId
          );
          if (e) {
            toast.error(e);
            return;
          }
          break;
      }

      setTimeout(() => {
        router.push('/order-confirmation');
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-4 md:py-10 space-y-8'>
      <h1 className='text-2xl md:text-3xl font-bold mb-6 flex gap-3 items-center'>
        <ShoppingCart size={28} />
        Checkout
      </h1>

      {/* Step 1: Shipping Address */}
      <section className='bg-white flex flex-col shadow rounded p-4 mb-8'>
        <h2 className='font-semibold text-lg mb-2'>Shipping Address</h2>
        {addressLoading ? (
          <>
            <div className='space-y-2 mb-2 animate-pulse'>
              {[...Array(1)].map((_, idx) => (
                <div
                  key={idx}
                  className='border border-gray-200 rounded-md p-3 flex items-center gap-4 bg-gray-50'
                >
                  <div className='rounded-full bg-gray-200 h-5 w-5 mr-2' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                    <div className='h-3 bg-gray-200 rounded w-2/3' />
                    <div className='h-3 bg-gray-100 rounded w-1/4' />
                  </div>
                  <div className='ml-auto h-3 w-12 bg-gray-200 rounded' />
                </div>
              ))}
            </div>
          </>
        ) : addresses.length === 0 ? (
          <div className='text-gray-500 p-2'>No addresses found. Please add one.</div>
        ) : (
          <ul className='space-y-2 mb-2'>
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className={`border rounded-md p-3 flex items-center gap-4 ${
                  selectedAddressId === addr.id ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <input
                  type='radio'
                  name='address'
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className='accent-primary'
                  id={addr.id}
                />
                <label htmlFor={addr.id} className='flex-1 cursor-pointer'>
                  <div className='font-medium flex items-center gap-2'>
                    {addr.fullName}
                    {addr.isDefault && (
                      <span className='text-xs rounded bg-green-50 text-green-500 border border-green-200 px-1 py-0.5 ml-2'>
                        Default
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                    {addr.area ? `, ${addr.area}` : ''}, {addr.city}
                    {addr.state ? `, ${addr.state}` : ''}, {addr.country}
                    {addr.postalCode ? `, ${addr.postalCode}` : ''}
                  </div>
                  <div className='text-xs text-gray-500'>Phone: {addr.phone}</div>
                  {addr.whatsappNumber && (
                    <div className='text-xs text-green-600'>WhatsApp: {addr.whatsappNumber}</div>
                  )}
                </label>
                {addr.label && (
                  <span className='ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-xs'>
                    {addr.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!addressLoading && addresses.length === 0 ? (
          <Button onClick={() => router.push('/address')}>Add Address</Button>
        ) : !addressLoading ? (
          <Label
            className='p-2 flex items-start text-sm font-medium text-foreground'
            htmlFor='agree'
          >
            <input
              id='agree'
              type='checkbox'
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              name='addressAgreement'
              className='mt-2 scale-125 align-middle'
              required
            />
            <span>
              I confirm that all the address information I have entered is accurate and valid. I
              understand that if the information is incorrect, my order may be canceled.
            </span>
          </Label>
        ) : (
          <></>
        )}
      </section>

      {/* Step 2: Order Summary */}
      <section className='bg-white shadow rounded p-4 mb-8'>
        <h2 className='font-semibold text-lg mb-4'>Order Summary</h2>
        {productLoading ? (
          <div className='space-y-2 animate-pulse'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex items-center gap-4 py-2'>
                <div className='bg-gray-200 rounded-xs w-16 h-16 sm:w-10 sm:h-10 md:w-12 md:h-12' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-2/3'></div>
                  <div className='h-3 bg-gray-100 rounded w-1/2'></div>
                </div>
                <div className='h-4 bg-gray-100 rounded w-12'></div>
              </div>
            ))}
            <div className='flex justify-end mt-4'>
              <div className='h-5 bg-gray-300 rounded w-32'></div>
            </div>
          </div>
        ) : safeCart.length === 0 ? (
          <div className='text-gray-500'>Your cart is empty.</div>
        ) : (
          <div>
            <ul className='divide-y mb-4'>
              {safeCart.map((item, index) => (
                <li
                  key={item.id + item.productId + (index + 1)}
                  className='w-full flex sm:flex-row flex-col justify-between items-end gap-4 py-3'
                >
                  <div className='flex items-start gap-2'>
                    <div>
                      <Image
                        src={item.image || '/placeholder.png'}
                        alt={item.title || 'Product'}
                        width={40}
                        height={40}
                        className='bg-gray-100 p-1 rounded-xs
                                   size-16 sm:size-10 md:size-12
                                   w-16 h-16 sm:w-10 sm:h-10 md:w-12 md:h-12'
                        style={{
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    <div className='font-medium w-full wrap-break-word text-sm sm:text-base md:text-lg'>
                      {item.title}
                    </div>
                  </div>
                  <div className=''>
                    <div className='text-sm text-gray-500'>
                      {formatCurrency(toNumber(item.basePrice || 0), item.currency || 'PKR')} ×{' '}
                      {quantity}
                    </div>
                    <div className='font-semibold ml-4'>
                      {formatCurrency(
                        toNumber(item.basePrice || 0) * quantity,
                        item.currency || 'PKR'
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className='space-y-1 text-right text-md'>
              <div>
                Subtotal:{' '}
                <span className='font-semibold'>
                  {formatCurrency(subTotal, safeCart[0]?.currency || 'PKR')}
                </span>
              </div>
              <div>
                Shipping:{' '}
                <span className='font-semibold'>
                  {formatCurrency(shippingFee, safeCart[0]?.currency || 'PKR')}
                </span>
              </div>
              <div>
                Discount:{' '}
                <span className='font-semibold text-destructive'>
                  -{formatCurrency(discount, safeCart[0]?.currency || 'PKR')}
                </span>
              </div>
              <div className='mt-2 text-lg font-bold'>
                Total: <span>{formatCurrency(total, safeCart[0]?.currency || 'PKR')}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Step 3: Payment method */}
      <section className='bg-white shadow rounded p-4 mb-8'>
        <h2 className='font-semibold text-lg mb-2'>Payment</h2>
        <div className='flex gap-6 items-center'>
          <label className='flex items-center gap-2'>
            <input
              type='radio'
              name='payment'
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
            />
            <span>Cash on Delivery</span>
          </label>
          <label className='flex text-gray-500 items-center gap-2'>
            <input
              type='radio'
              name='payment'
              disabled={true}
              checked={paymentMethod === 'JAZZCASH'}
              onChange={() => setPaymentMethod('JAZZCASH')}
            />
            JazzCash (Coming Soon)
          </label>
        </div>
      </section>

      {/* Place Order Button */}
      <div className='text-right'>
        <Button
          size='lg'
          disabled={safeCart.length === 0 || !selectedAddressId || isPlacingOrder || !agree}
          onClick={handlePlaceOrder}
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
}
