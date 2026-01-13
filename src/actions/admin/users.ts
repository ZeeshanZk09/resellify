"use server";
import { auth } from "@/auth";
import Prisma from "@/shared/lib/prisma";
import { authAdmin, authUser } from "@/shared/lib/utils/auth";

async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user)
      return {
        data: [],
        message: "Unauthorized",
      };

    const isAdmin = authAdmin();
    if (!isAdmin)
      return {
        data: [],
        message: "Unauthorized",
      };

    const users = await Prisma.user.findMany({
      where: {
        isActive: true,
      },
    });

    if (!users)
      return {
        data: [],
        message: "Users not found",
      };

    return {
      users,
      message: "Users fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      data: [],
      message: "Internal server error",
    };
  }
}

async function toggleUserActive(userId: string, isActive: boolean) {
  try {
    const session = await authUser();
    if (!session)
      return {
        success: false,
        message: "Unauthorized",
      };

    const isAdmin = authAdmin();
    if (!isAdmin)
      return {
        success: false,
        message: "Unauthorized",
      };

    const user = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) return false;

    await Prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return false;
  }
}

export { getUsers, toggleUserActive };
