"use server";
import { auth } from "@/auth";
import prisma from "@/shared/lib/prisma";

export const deleteAccount = async (command: string) => {
  try {
    const session = await auth();
    const user_email = session?.user?.email;
    if (!user_email) {
      return { error: "User not found" };
    }
    if (!command) {
      return { error: `Please enter "Delete account"` };
    }
    if (command !== "Delete account") {
      return { error: "Incorrect command" };
    }
    // 1. Delete related accounts
    await prisma.user.delete({
      where: { email: user_email },
    });

    // 3. Finally, delete the user
    await prisma.user.delete({
      where: { email: user_email },
    });

    return { success: "Account deleted successfully!" };
  } catch (error) {
    console.log(error);
    return { error: (error as Error).message || "Somting wenth wrong" };
  }
};
