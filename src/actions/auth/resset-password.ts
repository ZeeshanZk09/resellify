"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import prisma from "@/shared/lib/prisma";
import { sendVerification } from "../send-verification";

export const sendCodeForPasswordReset = async () => {
  const email = (await cookies()).get("login_email")?.value;
  if (!email) {
    return { error: "Please enter email" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  });

  if (!user) {
    return {
      error: "No account found with this email. Please check and try again.",
    };
  }

  if (!user.password) {
    return {
      error:
        "This account does not have a password. Try logging in with a provider.",
    };
  }

  await sendVerification(email);

  return { success: "Reset password code sent successfully!" };
};

export const verifyCode = async (code: string) => {
  const cookieStore = await cookies();
  const email = cookieStore.get("login_email")?.value;

  if (!email || !code) {
    return { error: "Missing required data for verification." };
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: code } },
  });

  if (!verificationToken) {
    return { error: "Verification token is missing" };
  }

  if (verificationToken.token !== code) {
    return { error: "Invalid verification code" };
  }

  if (verificationToken.expires < new Date()) {
    return { error: "Verification code has expired" };
  }
  // Delete the token after verification
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  return { success: "Email verified successfully!" };
};

export const resetPassword = async ({
  password,
  confirmPassword,
  email,
}: {
  password: string;
  confirmPassword: string;
  email: string;
}) => {
  if (!email) {
    return { error: "Email is required" };
  }

  if (!password || !confirmPassword) {
    return { error: "Missing required fields" };
  }

  if (password !== confirmPassword) {
    return { error: "New password and confirmation do not match" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      error: "No account found with this email. Please check and try again.",
    };
  }

  if (!user.password) {
    return {
      error:
        "This account does not have a password. Try logging in with a provider.",
    };
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  await signIn("credentials", { email, password, redirect: false });
  return { success: "Password reset successfully!" };
};
