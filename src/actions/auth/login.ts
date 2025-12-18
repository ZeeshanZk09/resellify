'use server';

import { signIn } from '@/auth';
import prisma from '@/shared/lib/prisma';
import { sendVerification } from '../send-verification';
import { cookies } from 'next/headers';

export const checkEmail = async (email: string) => {
  if (!email) {
    return { error: 'Please enter email' };
  }

  // Combine checks and return required fields only
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  if (!user) {
    return { error: 'No account found with this email. Please check and try again.' };
  }

  // Set the login email in cookies
  const cookie = await cookies();
  cookie.set('login_email', email, { httpOnly: true, maxAge: 300 });

  return { success: true };
};

export const login = async (password: string) => {
  if (!password) {
    return { error: 'Please enter password' };
  }

  const cookie = await cookies();
  const email = cookie.get('login_email')?.value;

  if (!email) {
    return { error: 'Please enter email' };
  }

  // Combine checks to reduce multiple queries
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true },
  });

  if (!user) {
    return { error: 'No account found with this email.' };
  }

  if (!user.password) {
    return {
      error:
        'This account does not have a password set. Try signing in with Google or another provider.',
    };
  }

  if (!user.emailVerified) {
    await sendVerification(email);
    cookie.set('login_password', password, { httpOnly: true, maxAge: 300 });
    return { error: 'EmailNotVerified' };
  }

  try {
    // Login attempt using credentials
    await signIn('credentials', { email, password, redirect: false });
    return { success: true };
  } catch (error) {
    console.error('Login error:', error); // Log detailed error for debugging
    return { error: 'Something went wrong' };
  }
};
