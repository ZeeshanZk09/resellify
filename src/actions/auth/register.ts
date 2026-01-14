'use server';

import { hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import type { z } from 'zod';
import { sendVerification } from '@/actions/send-verification';
import { signIn } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { signUpFormSchema } from '@/shared/lib/schemas';

type RegisterInput = z.infer<typeof signUpFormSchema>;

type RegisterResponse = {
  error?: string;
  success?: string;
};

export async function registerUser(formData: RegisterInput): Promise<RegisterResponse> {
  try {
    const parsedData = signUpFormSchema.safeParse(formData);
    if (!parsedData.success) {
      return {
        error: Array.isArray(parsedData.error?.issues)
          ? parsedData.error.issues
              .map((err: { message?: string }) => err.message || 'Validation error')
              .join(', ')
          : parsedData.error?.message || 'Validation error',
      };
    }

    const { name, email, password } = parsedData.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'Email already exists' };
    }

    const cookieStore = await cookies();
    cookieStore.set('login_password', password, {
      httpOnly: true,
      maxAge: 300,
    });
    cookieStore.set('login_email', email, { httpOnly: true, maxAge: 300 });
    cookieStore.set('login_name', name, { httpOnly: true, maxAge: 300 });
    const res = await sendVerification(email);
    if (!res) return { error: 'Error sending email' };
    return {
      success: 'User registered successfully. Verification code sent!',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong' };
  }
}

export async function verifyEmail(code: string) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('login_email')?.value;
    const name = cookieStore.get('login_name')?.value;
    const password = cookieStore.get('login_password')?.value;

    if (!email || !password || !name || !code) {
      return { error: 'Missing required data for verification.' };
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    if (!verificationToken) {
      return { error: 'Verification token is missing' };
    }

    if (verificationToken.token !== code) {
      return { error: 'Invalid verification code' };
    }

    if (verificationToken.expires < new Date()) {
      return { error: 'Verification code has expired' };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    let user: Awaited<ReturnType<typeof prisma.user.create>>;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    } catch (userCreationErr) {
      const errorMessage =
        userCreationErr instanceof Error ? userCreationErr.message : 'Unknown error occurred';
      return {
        error: `Failed to create user: ${errorMessage}`,
      };
    }

    // Generate a unique session token string (for demonstration, use a random string)
    const sessionToken =
      Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

    let session: Awaited<ReturnType<typeof prisma.session.create>>;
    try {
      session = await prisma.session.create({
        data: {
          sessionToken: sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days expiry (typical default)
        },
      });

      const cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });

      (await cookies()).set('cartId', cart.id);
    } catch (sessionErr) {
      // Roll back user if session creation fails
      await prisma.user.delete({ where: { id: user.id } });
      const errorMessage =
        sessionErr instanceof Error ? sessionErr.message : 'Unknown error occurred';
      return {
        error: `Failed to create session: ${errorMessage}`,
      };
    }

    // Clean up cookies
    cookieStore.delete('login_password');
    cookieStore.delete('login_email');
    cookieStore.delete('login_name');

    // Delete the token after verification
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Optionally sign in the user (if you want to set a session/cookie)
    await signIn('credentials', { email, password, redirect: false });

    // For debugging: confirm session row creation
    if (!session || !session.sessionToken || session.userId !== user.id) {
      return { error: 'Session was not properly created after registration.' };
    }

    return { success: 'User signed in successfully and session created.' };
  } catch (error) {
    console.log(error);
    return {
      error: 'An unexpected error occurred during registration. Please try again later.',
    };
  }
}
