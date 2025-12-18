"use client";

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SignedIn({ children }: Props) {
  const { data: session, status } = useSession();
  if ( status == "loading") return null
  return session ? children : null;
}

export function SignedOut({ children }: Props) {
  const { data: session, status } = useSession();
  if ( status == "loading") return null
  return !session ? children : null;
}