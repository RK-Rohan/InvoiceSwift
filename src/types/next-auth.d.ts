import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id?: string;
      uid?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
  }
}
