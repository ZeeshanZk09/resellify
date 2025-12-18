// next-auth.d.ts
import 'next-auth';
import { DefaultSession } from 'next-auth';
import { User as u } from '@/shared/lib/generated/prisma/client';
import { Session as s } from '@/shared/lib/generated/prisma/client';

declare module 'next-auth' {
  interface User extends u {}
  interface Session extends s {
    user: u & DefaultSession['user'];
  }
}

declare module 'next-auth' {
  interface JWT extends Session {
    password?: string;
    phoneNumber?: string;
  }
}
