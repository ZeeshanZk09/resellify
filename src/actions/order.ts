'use server';

import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { authUser } from '@/shared/lib/utils/auth';
import { Decimal } from '@prisma/client/runtime/client';
import { Session } from 'next-auth';

interface OrderItemInput {
  cartId: string;
  quantity: number;
  price: number; // unit price at time of order
  variantId?: string;
  sku?: string;
}

interface CreateOrderInput {
  addressId: string;
  items: OrderItemInput[];
  paymentMethod: 'COD' | 'JAZZCASH';
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount?: number;
  notes?: string;
}

/**
 * Generate a unique order number in format: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate a random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${dateStr}-${randomNum}`;
}

/**
 * Create a new order with order items
 */
export async function createOrder(input: CreateOrderInput, productId?: string) {
  try {
    console.log('[createOrder] Step 1: Authenticating user...');
    const session = (await authUser()) as Session;
    if (!session?.user?.id) {
      console.log('[createOrder] Authentication failed. No user id in session.');
      return {
        error: 'Unauthorized. Please login to place an order.',
      };
    }

    const userId = session.user.id;
    console.log('[createOrder] Step 2: User ID:', userId);

    // Validate address belongs to user
    console.log('[createOrder] Step 3: Validating address:', input.addressId);
    const address = await prisma.address.findFirst({
      where: {
        id: input.addressId,
        userId: userId,
      },
    });

    if (!address) {
      console.log('[createOrder] Invalid shipping address:', input.addressId);
      return {
        error: 'Invalid shipping address.',
      };
    }

    // Generate unique order number
    console.log('[createOrder] Step 4: Generating order number...');
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure order number is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) {
        console.log(`[createOrder] Order number generated (unique): ${orderNumber}`);
        break;
      }
      console.log(`[createOrder] Order number collision detected: ${orderNumber}, regenerating...`);
      orderNumber = generateOrderNumber();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('[createOrder] Failed to generate a unique order number after max attempts.');
      return {
        error: 'Failed to generate unique order number. Please try again.',
      };
    }

    // Handle "Buy Now" (productId provided) vs cart-based order creation
    if (productId) {
      console.log('[createOrder] Step 5 (productId mode): Creating single-product order.');

      // Fetch the product from DB
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          title: true,
          sku: true,
        },
      });

      if (!product) {
        console.log(`[createOrder] Product not found for productId: ${productId}`);
        return { error: 'Product not found.' };
      }

      // We expect input.items to have a single item describing the order
      const itemInput = input.items[0];
      if (
        !itemInput ||
        typeof itemInput.quantity !== 'number' ||
        typeof itemInput.price !== 'number'
      ) {
        console.log(
          '[createOrder] Invalid item data for single-product order.',
          itemInput,
          input.items
        );
        return { error: 'Invalid item data for order.' };
      }

      const lineTotal = itemInput.price * itemInput.quantity;
      const orderItemData = {
        productId: product.id,
        variantId: itemInput.variantId || null,
        sku: itemInput.sku || product.sku || null,
        title: product.title,
        price: new Decimal(itemInput.price),
        quantity: itemInput.quantity,
        lineTotal: new Decimal(lineTotal),
      };

      // Create the order and item in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            userId: userId,
            addressId: input.addressId,
            orderNumber: orderNumber,
            status: 'CREATED',
            paymentMethod: input.paymentMethod,
            paymentStatus: 'PENDING',
            subTotal: new Decimal(input.subTotal),
            shippingFee: new Decimal(input.shippingFee),
            discountAmount: new Decimal(input.discountAmount),
            taxAmount: new Decimal(input.taxAmount || 0),
            totalAmount: new Decimal(
              input.subTotal + input.shippingFee - input.discountAmount + (input.taxAmount || 0)
            ),
            notes: input.notes || null,
            placedAt: new Date(),
            items: {
              create: [orderItemData],
            },
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
            address: true,
          },
        });
      });

      console.log('[createOrder] Single-product order created successfully.');
      return {
        success: true,
      };
    } else {
      // Cart-based order (default/legacy mode)
      // Fix: Remove undefined/null/empty cartIds to avoid Prisma errors
      console.log('[createOrder] Step 5: Filtering valid cart item IDs...');
      const cartIds = input.items
        .map((item) => item.cartId)
        .filter((id): id is string => Boolean(id && id !== 'undefined' && id !== 'null'));
      console.log('[createOrder] Filtered cartIds:', cartIds);

      if (!cartIds.length) {
        console.log('[createOrder] No valid cart item IDs provided.', cartIds, input, input.items);
        return { error: 'No valid cart item IDs provided.' };
      }

      // Fetch cart items and related products for all items
      console.log('[createOrder] Step 6: Fetching cart items with their products from DB...');
      const cartItems = await prisma.cartItem.findMany({
        where: {
          id: { in: cartIds },
        },
        include: {
          product: {
            select: {
              id: true, // productId in the DB
              title: true,
              sku: true,
            },
          },
        },
      });
      console.log('[createOrder] Retrieved cartItems:', cartItems);

      const cartItemsMap = new Map(cartItems.map((c) => [c.id, c]));
      console.log('[createOrder] Created cartItemsMap for fast lookup.');

      // Validate all cartIds & corresponding products exist
      console.log('[createOrder] Step 7: Validating all cart and product IDs exist...');
      for (const item of input.items) {
        const cartItem = item.cartId && cartItemsMap.get(item.cartId);
        if (!cartItem || !cartItem.product?.id) {
          console.log(`[createOrder] Cart item or product not found for cartId: ${item.cartId}`);
          return {
            error: `Product with ID ${item.cartId} not found.`,
          };
        }
      }
      console.log('[createOrder] All cart and product IDs are valid and present.');

      // Create order with order items in a transaction
      console.log('[createOrder] Step 8: Creating order and items in DB transaction...');
      await prisma.$transaction(async (tx) => {
        // Create order items with correct productId FK (from .product.id)
        const orderItemsData = input.items
          .filter((item) => {
            const cartItem = item.cartId && cartItemsMap.get(item.cartId);
            return cartItem && cartItem.product?.id;
          })
          .map((item) => {
            const cartItem = cartItemsMap.get(item.cartId)!;
            const lineTotal = item.price * item.quantity;
            return {
              productId: cartItem.product.id,
              variantId: item.variantId || null,
              sku: item.sku || cartItem.product.sku || null,
              title: cartItem.product.title,
              price: new Decimal(item.price),
              quantity: item.quantity,
              lineTotal: new Decimal(lineTotal),
            };
          });

        console.log('[createOrder] orderItemsData:', orderItemsData);

        // Only proceed if there are valid order items
        if (!orderItemsData.length) {
          console.log('[createOrder] No valid cart items for order.');
          throw new Error('No valid cart items to create order for.');
        }

        // Create the order with order items
        console.log('[createOrder] Creating order in DB...');
        await tx.order.create({
          data: {
            userId: userId,
            addressId: input.addressId,
            orderNumber: orderNumber,
            status: 'CREATED',
            paymentMethod: input.paymentMethod,
            paymentStatus: 'PENDING',
            subTotal: new Decimal(input.subTotal),
            shippingFee: new Decimal(input.shippingFee),
            discountAmount: new Decimal(input.discountAmount),
            taxAmount: new Decimal(input.taxAmount || 0),
            totalAmount: new Decimal(
              input.subTotal + input.shippingFee - input.discountAmount + (input.taxAmount || 0)
            ),
            notes: input.notes || null,
            placedAt: new Date(),
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
            address: true,
          },
        });

        console.log('[createOrder] Order created successfully, now deleting cart items...');
        await tx.cartItem.deleteMany({
          where: {
            id: { in: cartIds },
          },
        });
        console.log('[createOrder] Cart items deleted after order.');
      });

      console.log('[createOrder] Step 9: Order successfully created.');
      return {
        success: true,
      };
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    return {
      error: error?.message || 'Failed to create order. Please try again.',
    };
  }
}
