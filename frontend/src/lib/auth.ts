import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      // Garanta um "id" estável no token (útil para `session.user.id`)
      if (!token.id) token.id = token.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? "") as string;
        // Ajuste conforme sua regra de negócio (ex.: buscar do DB)
        session.user.isPremium ??= false;
      }
      return session;
    },
  },
};

