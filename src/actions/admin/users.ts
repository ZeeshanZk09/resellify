"use server";
import { auth } from "@/auth";
import Prisma from "@/shared/lib/prisma";
import { authAdmin, authUser } from "@/shared/lib/utils/auth";

type UsersQuery = {
  search?: string;
  role?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  page?: number;
  pageSize?: number;
};

async function getUsers(query?: UsersQuery) {
  try {
    const session = await auth();
    if (!session?.user)
      return {
        data: [],
        message: "Unauthorized",
      };

    const isAdmin = await authAdmin();
    if ((isAdmin as { error?: string }).error)
      return {
        users: [],
        message: "Unauthorized",
      };

    const {
      search = "",
      role,
      isActive,
      isBlocked,
      page = 1,
      pageSize = 20,
    } = query || {};

    const where: NonNullable<
      Parameters<typeof Prisma.user.findMany>[0]
    >["where"] = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role as never;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    if (typeof isBlocked === "boolean") {
      where.isBlocked = isBlocked;
    }

    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      Prisma.user.count({ where }),
    ]);

    if (!users)
      return {
        users: [],
        message: "Users not found",
      };

    return {
      users,
      total,
      page,
      pageSize,
      message: "Users fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      users: [],
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

async function toggleUserRole(userId: string, newRole: "ADMIN" | "USER") {
  try {
    const session = await auth();
    if (!session?.user)
      return {
        success: false,
        message: "Unauthorized",
      };

    const isAdmin = await authAdmin();
    if ((isAdmin as { error?: string }).error)
      return {
        success: false,
        message: "Unauthorized",
      };

    if (session.user.id === userId) {
      return {
        success: false,
        message: "You cannot change your own role",
      };
    }

    const targetUser = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!targetUser)
      return {
        success: false,
        message: "User not found",
      };

    if (targetUser.email === "mzeeshankhan0988@gmail.com") {
      return {
        success: false,
        message: "Cannot change role of this user",
      };
    }

    await Prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return { success: true, message: "User role updated" };
  } catch (error) {
    console.error("Error toggling user role:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}

export { getUsers, toggleUserActive, toggleUserRole };
