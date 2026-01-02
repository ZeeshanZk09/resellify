'use server';
import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { Decimal } from '@prisma/client/runtime/client';
import { cookies } from 'next/headers';

// Cart CRUD operations

/**
 * Create a new cart for a user
 */
export async function createCart(userId: string, expiresAt?: Date) {
  try {
    return await prisma.cart.create({
      data: {
        userId,
        expiresAt,
      },
    });
  } catch (error) {}
}

/**
 * Get a cart for a user by userId
 */
export async function getCartByUserId(userId: string) {
  return await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
  });
}

/**
 * Get a cart by cartId
 */
export async function getCartById(cartId: string) {
  return await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  });
}

/**
 * Update cart information
 */
export async function updateCart(cartId: string, data: Partial<{ expiresAt: Date }>) {
  return await prisma.cart.update({
    where: { id: cartId },
    data,
  });
}

/**
 * Delete a cart by cartId (and cascade CartItems)
 */
export async function deleteCart(cartId: string) {
  return await prisma.cart.delete({
    where: { id: cartId },
  });
}

// CartItem CRUD operations

/**
 * Add item to cart (create CartItem)
 */
export async function addItemToCart(productId: string, price?: Decimal, quantity: number = 1) {
  try {
    const session = await auth();
    if (!session?.user.id) return 'Unauthorized';
    const cookieObj = await cookies();
    const cartId = cookieObj.get('cartId')! as unknown as string;
    console.log('add-item-to-cart: ', cartId);

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        price,
        quantity,
      },
    });

    return cartItem;
  } catch (error) {
    console.log(error);
    return null;
  }
}

/**
 * Update an item in the cart (quantity or price)
 */
export async function updateCartItem(
  cartItemId: string,
  data: Partial<{ quantity: number; price: Decimal }>
) {
  return await prisma.cartItem.update({
    where: { id: cartItemId },
    data,
  });
}

/**
 * Remove item from cart by cartItemId
 */
export async function removeItemFromCart(cartItemId: string) {
  return await prisma.cartItem.delete({
    where: { id: cartItemId },
  });
}

/**
 * Get all items in a cart by cartId
 */
export async function getCartItems(cartId: string) {
  return await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true },
  });
}

/**
 * Get a single CartItem by cartId and productId
 */
export async function getCartItem(cartId: string, productId: string) {
  return await prisma.cartItem.findFirst({
    where: { cartId, productId },
  });
}
