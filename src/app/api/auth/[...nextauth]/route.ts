// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import GithubProvider from 'next-auth/providers/github';
// import prisma from '@/lib/prisma';
// import { compare } from 'bcryptjs';
// export const authOptions = {
//   // Configure one or more authentication providers
//   providers: [
//     // GithubProvider({
//     //   clientId: process.env.GITHUB_ID,
//     //   clientSecret: process.env.GITHUB_SECRET,
//     // }),
//     Credentials({
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });

//         if (!user || !user.password || !user.emailVerified) {
//           return null;
//         }

//         const isValid = await compare(credentials.password as string, user.password);

//         if (!isValid) {
//           return null;
//         }

//         // MUST MATCH `User`
//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           password: user.password,
//           emailVerified: user.emailVerified,
//           phoneNumber: user.phoneNumber,
//         };
//       },
//     }),
//   ],
// };

// const nextAuthConfig = NextAuth(authOptions);
// export { nextAuthConfig as GET, nextAuthConfig as POST };
// /app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
