import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Necessário para manter a criptografia do JWT estável entre reinícios
  // (evita JWT_SESSION_ERROR: decryption operation failed)
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
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
    async signIn() {
      // Login permitido. O usuário será criado no backend apenas quando preencher o formulário de onboarding.
      return true;
    },
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
