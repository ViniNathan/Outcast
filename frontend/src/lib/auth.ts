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
      console.log("[AUTH] SignIn callback iniciado");
      console.log("[AUTH] Provider:", account?.provider);
      console.log("[AUTH] User ID:", user.id);
      console.log("[AUTH] User Name:", user.name);
      console.log("[AUTH] User Email:", user.email);
      
      // Cria o usuário no backend IMEDIATAMENTE após login bem-sucedido
      if (account?.provider === "google" && user.id && user.name && user.email) {
        try {
          const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
          const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();
          
          console.log("[AUTH] Backend URL:", backendUrl);
          console.log("[AUTH] Sync Secret exists:", !!syncSecret);
          console.log("[AUTH] Sync Secret length:", syncSecret?.length || 0);

          // Primeiro verifica se o usuário já existe
          const checkUrl = new URL(`${backendUrl}/api/me`);
          checkUrl.searchParams.set("authUserId", user.id);

          console.log("[AUTH] Verificando se usuário existe:", checkUrl.toString());

          const checkResp = await fetch(checkUrl.toString(), {
            headers: {
              ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
            },
          });

          console.log("[AUTH] Status da verificação:", checkResp.status);

          // Se não existir (404), criar usuário vazio
          if (!checkResp.ok) {
            console.log("[AUTH] Usuário não existe. Criando...");
            
            const payload = {
              userId: user.id,
              name: user.name || "Novo Usuário",
              age: 18,
              description: "Pendente",
            };
            
            console.log("[AUTH] Payload para criação:", JSON.stringify(payload));

            const createResp = await fetch(`${backendUrl}/api/objective`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
              },
              body: JSON.stringify(payload),
            });

            console.log("[AUTH] Status da criação:", createResp.status);
            const createText = await createResp.text();
            console.log("[AUTH] Resposta da criação:", createText);

            if (!createResp.ok) {
              console.error("[AUTH] ❌ Falha ao criar usuário no backend");
            } else {
              console.log("[AUTH] ✅ Usuário criado com sucesso:", user.id);
            }
          } else {
            console.log("[AUTH] ✅ Usuário já existe no backend");
          }
        } catch (error) {
          console.error("[AUTH] ❌ Erro ao criar usuário no backend:", error);
        }
      } else {
        console.log("[AUTH] ⚠️ Condições não atendidas para criar usuário");
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

