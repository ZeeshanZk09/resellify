'use server';

import { auth, unstable_update } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { profileSchema } from '@/shared/lib/schemas';

import { z } from 'zod';
type RegisterInput = z.infer<typeof profileSchema>;
export const updateProfile = async (formData: RegisterInput) => {
  try {
    const parsedData = profileSchema.safeParse(formData);
    if (!parsedData.success) {
      return {
        error: parsedData.error.issues.map((err) => err.message).join(', '),
      };
    }
    const { name, phoneNumber } = parsedData.data;
    const session = await auth();
    console.log(session);
    debugger;
    const user = session?.user;
    if (!user || !user?.email!) {
      return { error: 'User not authenticated.' };
    }
    await prisma.user.update({
      where: { email: user.email },
      data: { name, phoneNumber },
    });

    await unstable_update({ user: { ...session.user, name, phoneNumber } });

    return { success: 'User updated with success' };
  } catch (err) {
    console.log(err);
    return { error: (err as Error).message || 'Somting wenth wrong' };
  }
};
