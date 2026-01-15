import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Add other providers here if needed
  ],
  // Optional: Configure session management (defaults to JWT if no database is used)
  session: {
    strategy: 'jwt',
  },
  // Optional: Add callbacks for advanced configuration
  // callbacks: { ... }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };