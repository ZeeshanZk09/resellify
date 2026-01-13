"use server";

import { compare, hash } from "bcryptjs";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";

type Props = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const updatePassword = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}: Props) => {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "User not found" };
    }

    if (!newPassword || !confirmPassword) {
      return { error: "Missing required fields" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "New password and confirmation do not match" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { error: "User not found" };
    }

    // If user signed in via OAuth and has no password set
    if (!user.password) {
      const hashedPassword = await hash(newPassword, 10);
      await prisma.user.update({
        data: { password: hashedPassword },
        where: { id: userId },
      });
      return { success: "Password updated successfully" };
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return { error: "Incorrect current password" };
    }

    // Hash the new password before saving
    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      data: { password: hashedPassword },
      where: { id: userId },
    });

    return { success: "Password updated successfully" };
  } catch (error) {
    console.log(error);
  }
};
