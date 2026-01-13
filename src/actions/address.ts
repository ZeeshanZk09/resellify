'use server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import type { AddressCreateInput } from '@/shared/lib/generated/prisma/models';
import prisma from '@/shared/lib/prisma';
import { authUser } from '@/shared/lib/utils/auth';

async function getAddress() {
  try {
    const userId = (await auth())?.user.id;
    if (!userId) return 'Unauthorized.';

    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
    });

    console.log('address-in-server-action: ', addresses);

    return addresses;
  } catch (error) {
    console.log(error);
    return {
      error: 'Failed to get Address.',
    };
  }
}

async function createAddress(data: AddressCreateInput) {
  try {
    const userId = ((await authUser()) as Session).user.id;
    if (!userId) return 'Unauthorized.';

    const address = await prisma.address.create({
      data: {
        userId,
        state: data.state,
        postalCode: data.postalCode,
        nearbyLandmark: data.nearbyLandmark,
        line2: data.line2,
        line1: data.line1,
        label: data.label,
        country: data.country,
        whatsappNumber: data.whatsappNumber,
        fullName: data.fullName,
        area: data.area,
        city: data.city,
        phone: data.phone,
        isDefault: true,
      },
    });

    return address;
  } catch (error) {
    console.log(error);
    return {
      error: 'Failed to add address.',
    };
  }
}

export { getAddress, createAddress };
