"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
}

export function SignedIn({ children }: Props) {
  const { data: session, status } = useSession();
  if (status == "loading") return null;
  return session ? children : null;
}

export function SignedOut({ children }: Props) {
  const { data: session, status } = useSession();
  if (status == "loading") return null;
  return !session ? children : null;
}

export function AuthAdmin({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.replace("/"); // ✅ safe navigation
    }
  }, [session, status, router]);

  if (status === "loading") return null;

  if (!session || session.user.role !== "ADMIN") {
    return null; // ⛔ render kuch bhi nahi kare
  }

  return children;
}
