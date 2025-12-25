"use server";

import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";

export const getUser = async () => {
  try {
    const session = await auth();
    console.log("user session: ", session);
    const user = session?.user;

    if (!user) {
      return null;
    }

    const userData = await prisma.user.findUnique({
      where: { email: user?.email! },
      select: {
        name: true,
        id: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        isPlusMember: true,
        plusUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("accounts: ", userData);

    return userData;
  } catch (error) {
    console.log("error: ", error);
    return { error: "Failed to get user accounts" };
  }
};
