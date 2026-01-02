import { auth } from '@/auth';
import prisma from '../prisma';
async function authAdmin() {
  const session = await auth();

  try {
    const explicitlyAdmins =
      session?.user?.email === 'mzeeshankhan0988@gmail.com' ||
      session?.user?.email === 'apnacampus.it@gmail.com' ||
      session?.user?.email === 'zebotix@gmail.com' ||
      session?.user?.email === 'dr5269139@gmail.com';

    if (explicitlyAdmins) {
      await prisma.user.update({
        where: {
          id: session?.user?.id,
        },
        data: {
          role: 'ADMIN',
        },
      });
      return session;
    }
  } catch (error) {
    console.log(error);
  }

  if (!session?.user?.id || session.user.role !== 'ADMIN') return { error: 'Unauthorized' };
  return session;
}

async function authUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };
    return session;
  } catch (error) {
    console.log(error);
    return { error: 'Unauthorized' };
  }
}

export { authAdmin, authUser };
