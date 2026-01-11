"use server";

import { signIn } from "@/auth";
import prisma from "@/shared/lib/prisma";
import { sendVerification } from "../send-verification";
import { cookies } from "next/headers";

export const checkEmail = async (email: string) => {
  if (!email) {
    return { error: "Please enter email" };
  }

  // Combine checks and return required fields only
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, emailVerified: true, name: true },
  });

  if (!user) {
    return {
      error: "No account found with this email. Please check and try again.",
    };
  }

  // Set the login email in cookies
  const cookie = await cookies();
  cookie.set("login_email", email, { httpOnly: true, maxAge: 300 });

  if (user.emailVerified) {
    return {
      success: `Welcome back ${user.name}`,
    };
  }

  return { success: `OTP sent to the email: ${email}` };
};

export const login = async (password: string) => {
  if (!password) {
    return { error: "Please enter password" };
  }

  const cookie = await cookies();
  const email = cookie.get("login_email")?.value;

  if (!email) {
    return { error: "Please enter email" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, emailVerified: true },
  });

  if (!user) {
    return { error: "No account found with this email." };
  }

  if (!user.password) {
    return {
      error:
        "This account does not have a password set. Try signing in with Google or another provider.",
    };
  }

  if (!user.emailVerified) {
    await sendVerification(email);
    cookie.set("login_password", password, { httpOnly: true, maxAge: 300 });
    return { error: "EmailNotVerified" };
  }

  try {
    let cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }
    (await cookies()).set("cartId", cart.id);

    // 🔐 NextAuth credentials login
    await signIn("credentials", { email, password, redirect: false });

    const now = new Date();

    // 🔍 Check for existing valid session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        isExpired: false,
        expires: {
          gt: now, // current time < expires
        },
      },
      orderBy: {
        expires: "desc",
      },
    });

    let session;

    if (existingSession) {
      // ✅ Reuse existing session
      session = existingSession;
    } else {
      // ❌ Mark old sessions as expired
      await prisma.session.updateMany({
        where: {
          userId: user.id,
          isExpired: false,
        },
        data: {
          isExpired: true,
        },
      });

      // ➕ Create new session
      session = await prisma.session.create({
        data: {
          userId: user.id,
          isExpired: false,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          sessionToken: crypto.randomUUID(),
        },
      });
    }

    // (Optional) sessionToken ko cookie me set kar sakte ho
    // cookie.set("session_token", session.sessionToken, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 60 * 60,
    // });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Invalid email or password" };
  }
};
