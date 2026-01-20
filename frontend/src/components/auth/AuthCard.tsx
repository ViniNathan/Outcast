"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";

const errorPtBr: Record<string, string> = {
  OAuthAccountNotLinked:
    "Esse e-mail já está vinculado a outro método de login. Entre usando o provedor correto.",
  AccessDenied: "Acesso negado.",
  Configuration:
    "Erro de configuração do login. Verifique variáveis de ambiente e providers.",
  Verification: "Link inválido ou expirado.",
  Default: "Não foi possível entrar. Tente novamente.",
};

export function AuthCard({
  error,
}: {
  error?: string;
}) {
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return errorPtBr[error] ?? errorPtBr.Default;
  }, [error]);

  const handleContinue = async () => {
    await signIn("google", { callbackUrl: "/?next=dashboard" });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-black px-4">
      <Link
        href="/"
        className="absolute left-3 top-3 text-zinc-500 transition-colors hover:text-red-500"
      >
        <ChevronLeft className="h-12 w-12" />
      </Link>

      <div className="w-full max-w-md border border-zinc-900 bg-black/95 p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-1 h-16 bg-red-900/80"></div>
        
        <div className="space-y-2 mb-8 border-l-4 border-red-900/80 pl-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
            ACESSO AO SISTEMA
          </h1>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
            Identifique-se para prosseguir.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-4 border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400 font-mono">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleContinue}
            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden bg-red-900/20 border border-red-900/30 text-red-500 font-mono font-bold uppercase tracking-widest transition-all hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Acessar Sistema
            </span>
          </button>

          <p className="text-center text-[10px] text-zinc-700 font-mono uppercase tracking-wider">
            Ao continuar, você concorda com os protocolos de segurança.
          </p>
        </div>
      </div>
    </div>
  );
}

