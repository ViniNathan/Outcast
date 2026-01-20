"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
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
  const title = mode === "login" ? "ACESSO AO SISTEMA" : "REGISTRO OBRIGATÓRIO";
  const subtitle =
    mode === "login"
      ? "Identifique-se para prosseguir."
      : "O sistema requer seus dados biométricos e psicológicos.";

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
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md border border-zinc-900 bg-black/95 p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-1 h-16 bg-red-900/80"></div>
        
        <div className="space-y-2 mb-8 border-l-4 border-red-900/80 pl-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
            {title}
          </h1>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
            {subtitle}
          </p>
        </div>

        {errorMessage || localError ? (
          <div className="mt-4 border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400 font-mono">
            {localError ?? errorMessage}
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-red-900/80 block">
                Identificação do Receptáculo
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm placeholder:text-zinc-700 focus:border-red-900/50 focus:outline-none transition-colors uppercase"
                placeholder="SEU NOME / APELIDO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 block">
                  Ciclo Biológico (Idade)
                </label>
                <input
                  value={idade}
                  onChange={(e) => setIdade(e.target.value)}
                  inputMode="numeric"
                  className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm placeholder:text-zinc-700 focus:border-red-900/50 focus:outline-none transition-colors"
                  placeholder="00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-red-900/80 block">
                  Diretriz Primária
                </label>
                <input
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm placeholder:text-zinc-700 focus:border-red-900/50 focus:outline-none transition-colors uppercase"
                  placeholder="SOBREVIVÊNCIA"
                />
              </div>
            </div>
          </div>
          
        ) : null}

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleContinue}
            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden bg-red-900/20 border border-red-900/30 text-red-500 font-mono font-bold uppercase tracking-widest transition-all hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              {mode === "login" ? "Acessar Sistema" : "Inicializar Sistema"}
            </span>
          </button>

          <p className="text-center text-[10px] text-zinc-700 font-mono uppercase tracking-wider">
            Ao continuar, você concorda com os protocolos de segurança.
          </p>
        </div>
      </div>

      {mode === "register" && (
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-md text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            Já tem uma conta? <span className="underline">Entre aqui</span>
          </Link>
        </div>
      )}
    </div>
  );
}

