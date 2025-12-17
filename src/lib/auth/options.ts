import type { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { validateCredentials } from '@/lib/auth/user-service';

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const user = await validateCredentials(credentials.email, credentials.password);
        if (!user) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user._id.toString(),
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.uid === 'string' ? token.uid : undefined;
        (session.user as typeof session.user & { uid?: string }).uid = session.user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
