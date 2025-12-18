'use server';

import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
const UPLOAD_DIR = path.join(process.cwd(), './../../public/uploads/products');

/* -----------------------------------------
  Utils
------------------------------------------ */

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    console.log(error);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

function getFileName(productId: string, file: File) {
  try {
    const ext = file.name.split('.').pop();
    return `${productId}.${ext}`;
  } catch (error) {
    console.log(error);
  }
}

/* -----------------------------------------
  Upload / Update Product Image
------------------------------------------ */

export async function uploadProductImage(
  productId: string,
  file: File,
  caption?: string,
  altText?: string,
  order = 0,
  isPrimary = false
) {
  try {
    /* ---------------- AUTH ---------------- */
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    if (!file) return { error: 'File is required' };

    /* ---------------- VALIDATION ---------------- */
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return { error: 'Only JPG, JPEG, PNG, WEBP allowed' };

    if (file.size > 3 * 1024 * 1024) return { error: 'Max file size is 3MB' };

    /* ---------------- PRODUCT OWNERSHIP CHECK (IMPORTANT) ---------------- */
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true },
    });

    if (!product || product.userId !== session.user.id) return { error: 'Forbidden' };

    /* ---------------- FILE SYSTEM ---------------- */
    await ensureUploadDir();

    const fileName = getFileName(productId, file);
    const filePath = path.join(UPLOAD_DIR, fileName!);

    const buffer = Buffer.from(await file.arrayBuffer());

    /* ---------------- IMAGE METADATA ---------------- */
    const { width, height } = await sharp(buffer).metadata();

    if (!width || !height) return { error: 'Invalid image' };

    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/products/${fileName}`;

    /* ---------------- PRIMARY IMAGE LOGIC ---------------- */
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    /* ---------------- DB SAVE ---------------- */
    const productImage = await prisma.productImage.create({
      data: {
        productId,
        path: imageUrl,
        fileName: fileName!,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        altText,
        caption,
        order,
        isPrimary,
      },
    });

    return { success: true, image: productImage };
  } catch (error) {
    console.error('UPLOAD_PRODUCT_IMAGE_ERROR', error);
    return { error: 'Failed to upload product image' };
  }
}
/* -----------------------------------------
  Delete Product Image
------------------------------------------ */

export async function deleteProductImage(productId: string, img_path: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const filePath = path.join(process.cwd(), 'public', img_path);

    try {
      await fs.unlink(filePath);
    } catch {
      return { error: 'No product found' };
    }

    await prisma.productImage.delete({ where: { id: productId } });

    return { success: true };
  } catch (error) {
    console.error('DELETE_PRODUCT_IMAGE_ERROR', error);
    return { error: 'Failed to delete image' };
  }
}
