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
    async signIn({ user, account }) {
      
      // Cria o usuário no backend IMEDIATAMENTE após login bem-sucedido
      if (account?.provider === "google" && user.id && user.name && user.email) {
        try {
          const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
          const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();
          
          // Primeiro verifica se o usuário já existe
          const checkUrl = new URL(`${backendUrl}/api/me`);
          checkUrl.searchParams.set("authUserId", user.id);

          const checkResp = await fetch(checkUrl.toString(), {
            headers: {
              ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
            },
          });

          // Se não existir (404), criar usuário vazio
          if (!checkResp.ok) {
            
            const payload = {
              userId: user.id,
              name: user.name || "Novo Usuário",
              age: 18,
              description: "Pendente",
            };
            
            const createResp = await fetch(`${backendUrl}/api/objective`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
              },
              body: JSON.stringify(payload),
            });

            if (!createResp.ok) {
              console.error("[AUTH] ❌ Falha ao criar usuário no backend");
            }
          }
        } catch (error) {
          console.error("[AUTH] ❌ Erro ao criar usuário no backend:", error);
        }
      }
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
