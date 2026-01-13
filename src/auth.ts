// auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth";
import prisma from "@/shared/lib/prisma";
import { authConfig } from "./shared/lib/auth.config";

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        data: {
          emailVerified: new Date(),
        },
        where: {
          id: user.id,
        },
      });
    },

    updateUser: async ({ user }) => {
      // Updates the user in the database when the updateUser event is triggered

      if (user && user.id) {
        // Exclude protected fields like password unless intentionally updating
        const { id, ...data } = user;
        try {
          // Ensure compatibility with Prisma's update input types.
          // Remove fields with `null` values for keys that cannot accept nulls in Prisma.
          const sanitizedData = Object.fromEntries(
            Object.entries(data).filter(
              ([key, value]) => value !== undefined && value !== null,
            ),
          );
          await prisma.user.update({
            where: { id },
            data: sanitizedData,
          });
        } catch (error) {
          console.error(
            "Failed to update user during updateUser event:",
            error,
          );
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  ...authConfig,
});
