'use server';

import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { authUser } from '@/shared/lib/utils/auth';
import { Decimal } from '@prisma/client/runtime/client';
import { Session } from 'next-auth';

interface OrderItemInput {
  productId: string;
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
export async function createOrder(input: CreateOrderInput) {
  try {
    const session = (await authUser()) as Session;
    if (!session?.user?.id) {
      return {
        error: 'Unauthorized. Please login to place an order.',
      };
    }

    const userId = session.user.id;

    // Validate address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: input.addressId,
        userId: userId,
      },
    });

    if (!address) {
      return {
        error: 'Invalid shipping address.',
      };
    }

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure order number is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return {
        error: 'Failed to generate unique order number. Please try again.',
      };
    }

    // Fetch product titles for all items
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        title: true,
        sku: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist
    for (const item of input.items) {
      if (!productMap.has(item.productId)) {
        return {
          error: `Product with ID ${item.productId} not found.`,
        };
      }
    }

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order items with product titles
      const orderItemsData = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const lineTotal = item.price * item.quantity;
        return {
          productId: item.productId,
          variantId: item.variantId || null,
          sku: item.sku || product.sku || null,
          title: product.title,
          price: new Decimal(item.price),
          quantity: item.quantity,
          lineTotal: new Decimal(lineTotal),
        };
      });

      // Create the order with items
      const newOrder = await tx.order.create({
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

      return newOrder;
    });

    return {
      success: true,
      order: order,
      orderNumber: order.orderNumber,
    };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return {
      error: error?.message || 'Failed to create order. Please try again.',
    };
  }
}
