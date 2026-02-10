'use server';
import { auth } from '@/auth';
import prisma from '@/shared/lib/prisma';

export const deleteAccount = async (prevState: any, formData: FormData) => {
  try {
    const session = await auth();
    const user_email = session?.user?.email;
    if (!user_email) {
      return { error: 'User not found' };
    }
    const command = formData.get('command') as string;
    if (!command) {
      return { error: `Please enter "Delete account"` };
    }
    if (command !== 'Delete account') {
      return { error: 'Incorrect command' };
    }

    // Delete user (Prisma will handle cascading if configured, but let's be explicit if needed)
    // Actually, based on previous code, it was deleting it twice which is weird.
    await prisma.user.delete({
      where: { email: user_email },
    });

    return { success: 'Account deleted successfully!' };
  } catch (error) {
    console.error(error);
    return { error: (error as Error).message || 'Something went wrong' };
  }
};
