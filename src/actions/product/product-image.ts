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

type UploadTarget = { type: 'PRODUCT'; productId: string } | { type: 'BRAND'; brandId: string };

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public/uploads');

const UPLOAD_DIRS = {
  PRODUCT: 'products',
  BRAND: 'brands',
};

function resolveUploadContext(target: UploadTarget) {
  if (target.type === 'PRODUCT') {
    return {
      dir: UPLOAD_DIRS.PRODUCT,
      where: { id: target.productId },
      ownershipKey: 'userId',
    };
  }

  return {
    dir: UPLOAD_DIRS.BRAND,
    where: { id: target.brandId },
    ownershipKey: 'userId',
  };
}

/* -----------------------------------------
  Upload / Update Product Image
------------------------------------------ */

export async function uploadImage(
  target: UploadTarget,
  files: File | File[],
  options?: {
    caption?: string;
    altText?: string;
    order?: number;
    isPrimary?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return { error: 'File is required' };

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const context = resolveUploadContext(target);

    /* ---------- Ownership Check ---------- */
    const entity =
      target.type === 'PRODUCT'
        ? await prisma.product.findUnique({
            where: context.where,
            select: { publishedById: true },
          })
        : await prisma.brand.findUnique({
            where: context.where,
            select: { publishedById: true },
          });

    if (!entity || entity.publishedById !== session.user.id) return { error: 'Forbidden' };

    /* ---------- FS ---------- */
    const uploadDir = path.join(UPLOAD_BASE_DIR, context.dir);
    await fs.mkdir(uploadDir, { recursive: true });

    /* ---------- BRAND LOGO RULE ---------- */
    if (target.type === 'BRAND') {
      await prisma.upload.deleteMany({
        where: { brandId: target.brandId },
      });
    }

    const uploads = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!allowedTypes.includes(file.type)) return { error: 'Invalid image type' };

      if (file.size > 3 * 1024 * 1024) return { error: 'Max file size is 3MB' };

      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      const meta = await sharp(buffer).metadata();

      if (!meta.width || !meta.height) return { error: 'Invalid image' };

      await fs.writeFile(filePath, buffer);

      const imageUrl = `/uploads/${context.dir}/${fileName}`;

      const upload = await prisma.upload.create({
        data: {
          path: imageUrl,
          fileName,
          mimeType: file.type,
          size: file.size,
          width: meta.width,
          height: meta.height,
          altText: options?.altText,
          caption: options?.caption,
          order: options?.order ?? i,
          isPrimary: options?.isPrimary ?? i === 0,
          productId: target.type === 'PRODUCT' ? target.productId : undefined,
          brandId: target.type === 'BRAND' ? target.brandId : undefined,
        },
      });

      uploads.push(upload);
    }

    return {
      success: true,
      images: uploads,
      urls: uploads.map((u) => u.path),
    };
  } catch (err) {
    console.error('UPLOAD_ERROR', err);
    return { error: 'Upload failed' };
  }
}

/* -----------------------------------------
  Delete Product Image
  ------------------------------------------ */
export async function deleteImage(uploadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') return { error: 'Unauthorized' };

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        product: true,
        brand: true,
      },
    });

    if (!upload) return { error: 'Image not found' };

    const ownerId = upload.product?.publishedById || upload.brand?.publishedById;
    if (ownerId !== session.user.id) return { error: 'Forbidden' };

    const filePath = path.join(process.cwd(), 'public', upload.path);
    await fs.unlink(filePath).catch(() => null);

    await prisma.upload.delete({ where: { id: uploadId } });

    return { success: true };
  } catch (err) {
    console.error('DELETE_IMAGE_ERROR', err);
    return { error: 'Delete failed' };
  }
}

export async function setPrimaryImage(productId: string, imageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { publishedById: true },
    });

    if (!product || product.publishedById !== session.user.id) return { error: 'Forbidden' };

    await prisma.upload.updateMany({
      where: { productId },
      data: { isPrimary: false, uploadedAt: new Date() },
    });

    await prisma.upload.update({
      where: { id: imageId },
      data: { isPrimary: true, uploadedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error('SET_PRIMARY_IMAGE_ERROR', error);
    return { error: 'Failed to set primary image' };
  }
}
// async function ensureUploadDir() {
//   try {
//     await fs.access(UPLOAD_DIR);
//   } catch (error) {
//     console.log(error);
//     await fs.mkdir(UPLOAD_DIR, { recursive: true });
//   }
// }

// function getFileName(productId: string, file: File) {
//   try {
//     const ext = file.name.split('.').pop();
//     return `${productId}.${ext}`;
//   } catch (error) {
//     console.log(error);
//   }
// }
