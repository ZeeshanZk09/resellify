'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@auth/core/types';
import { SessionProvider } from 'next-auth/react';
import { getUser } from '@/actions/profile/user-accounts';
import { Role } from '@/shared/lib/generated/prisma/enums';

type Props = {
  children: React.ReactNode;
  session?: Session | null;
};

export type AuthContextValue = {
  update: (data: Partial<User>) => void;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children, session }: Props) => {
  const [user, setUser] = useState<User | null>(session?.user || null);
  const update = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = (await getUser()) as {
          name: string;
          id: string;
          email: string;
          emailVerified: Date | null;
          password: string;
          phoneNumber: string | null;
          role: Role;
          isActive: boolean;
          isBlocked: boolean;
          isPlusMember: boolean;
          plusUntil: Date | null;
          createdAt: Date;
          updatedAt: Date | null;
        };
        setUser(user || null);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  console.log('user-in-provider: ', user);
  return (
    <SessionProvider session={session}>
      <AuthContext.Provider value={{ user, update }}>{children}</AuthContext.Provider>
    </SessionProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
