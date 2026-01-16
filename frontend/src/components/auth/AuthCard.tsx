"use client";

import { signIn } from "next-auth/react";
import { useMemo } from "react";

type Mode = "login" | "register";

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
  mode,
  error,
}: {
  mode: Mode;
  error?: string;
}) {
  const title = mode === "login" ? "Entrar" : "Criar conta";
  const subtitle =
    mode === "login"
      ? "Acesse sua conta para continuar."
      : "Crie sua conta em segundos com o Google.";

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return errorPtBr[error] ?? errorPtBr.Default;
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Continuar com Google
          </button>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Ao continuar, você concorda com os termos e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}

