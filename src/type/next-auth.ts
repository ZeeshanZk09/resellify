// next-auth.d.ts
import "next-auth";
import type { DefaultSession } from "next-auth";
import type {
  Session as s,
  User as u,
} from "@/shared/lib/generated/prisma/client";

declare module "next-auth" {
  interface User extends u {}
  interface Session extends s {
    user: u &
      DefaultSession["user"] & {
        cartId: string;
      };
  }
}

declare module "next-auth" {
  interface JWT extends Session {
    password?: string;
    phoneNumber?: string;
  }
}
