// /auth.config.ts

import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { sendVerification } from "@/actions/send-verification";
import prisma from "@/shared/lib/prisma";
import type { Role } from "./generated/prisma/enums";
// import Linkedin from 'next-auth/providers/linkedin';

export const authConfig = {
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (
        isLoggedIn &&
        (nextUrl.pathname === "/auth/sign-in" ||
          nextUrl.pathname === "/auth/sign-up")
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    // Linkedin({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email as string;

        const user = await prisma.user.findUnique({
          where: { email: email },
        });
        if (!user || !user.password) {
          return null;
        }

        if (!user.emailVerified) {
          return null;
        }
        const isValid = await compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) {
          return null;
        }
        console.log("user ahmade: ", user);
        return user;
      },
    }),
  ],
} satisfies NextAuthConfig;
