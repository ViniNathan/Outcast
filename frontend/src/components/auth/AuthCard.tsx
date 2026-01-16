"use client";

import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

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
      : "Crie sua conta com o Google e finalize seu perfil.";

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return errorPtBr[error] ?? errorPtBr.Default;
  }, [error]);

  const handleContinue = async () => {
    setLocalError(null);

    if (mode === "register") {
      if (!nome.trim() || !idade.trim() || !objetivo.trim()) {
        setLocalError("Preencha Nome, Idade e Objetivo para continuar.");
        return;
      }
      const idadeNum = Number(idade);
      if (!Number.isFinite(idadeNum) || idadeNum <= 0 || idadeNum > 120) {
        setLocalError("Idade inválida.");
        return;
      }

      try {
        window.localStorage.setItem(
          "outcast_profile_pending",
          JSON.stringify({
            nome: nome.trim(),
            idade: idadeNum,
            objetivo: objetivo.trim(),
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // Se falhar, ainda permitimos login; só não persistimos o perfil local.
      }
    }

    await signIn("google", { callbackUrl: "/?next=dashboard" });
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-black px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-black/80 p-6 backdrop-blur">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
            {title}
          </h1>
          <p className="text-sm leading-6 text-zinc-500 font-mono">
            {subtitle}
          </p>
        </div>

        {errorMessage || localError ? (
          <div className="mt-4 border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400 font-mono">
            {localError ?? errorMessage}
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                Nome
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-200 font-mono text-sm focus:border-red-900 focus:outline-none transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                Idade
              </label>
              <input
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
                inputMode="numeric"
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-200 font-mono text-sm focus:border-red-900 focus:outline-none transition-colors"
                placeholder="Ex: 24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                Objetivo
              </label>
              <input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-200 font-mono text-sm focus:border-red-900 focus:outline-none transition-colors"
                placeholder="Ex: Ganhar massa / Disciplina / Emagrecer"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex h-11 w-full items-center justify-center border border-zinc-800 bg-zinc-950 px-4 text-xs font-bold text-zinc-200 transition hover:border-red-600 hover:text-red-500 uppercase tracking-widest font-mono"
          >
            Continuar com Google
          </button>

          <p className="text-center text-xs text-zinc-600 font-mono">
            Ao continuar, você concorda com os termos e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}

