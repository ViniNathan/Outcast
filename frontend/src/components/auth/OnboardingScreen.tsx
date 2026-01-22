"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/UI/UpgradeModal";

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleContinue = async () => {
    setLocalError(null);

    if (!nome.trim() || !idade.trim() || !objetivo.trim()) {
      setLocalError("Preencha Nome, Idade e Objetivo para continuar.");
      return;
    }
    const idadeNum = Number(idade);
    if (!Number.isFinite(idadeNum) || idadeNum <= 0 || idadeNum > 120) {
      setLocalError("Idade inválida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome: nome.trim(),
        idade: idadeNum,
        objetivo: objetivo.trim(),
      };
      
      const resp = await fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await resp.text();
      if (!resp.ok) {
        setLocalError(`Erro ao criar perfil: ${responseText}`);
        setIsSubmitting(false);
        return;
      }

      // Sucesso - mostrar modal de upgrade antes de completar
      setIsSubmitting(false);
      setShowUpgradeModal(true);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setLocalError(`Erro ao conectar com o servidor: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md border border-zinc-900 bg-black/95 p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-1 h-16 bg-red-900/80"></div>
        
        <div className="space-y-2 mb-8 border-l-4 border-red-900/80 pl-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono uppercase">
            REGISTRO OBRIGATÓRIO
          </h1>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
            O sistema requer seus dados biométricos e psicológicos.
          </p>
        </div>

        {localError ? (
          <div className="mt-4 border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400 font-mono">
            {localError}
          </div>
        ) : null}

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-red-900/80 block">
              Identificação do Receptáculo
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm placeholder:text-zinc-700 focus:border-red-900/50 focus:outline-none transition-colors uppercase disabled:opacity-50"
              placeholder="SEU NOME / APELIDO"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 block" htmlFor="idade">
                Ciclo Biológico (Idade)
              </label>
              <input
                value={idade}
                onChange={(e) => setIdade(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                disabled={isSubmitting}
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm placeholder:text-zinc-700 focus:border-red-900/50 focus:outline-none transition-colors disabled:opacity-50"
                placeholder="00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-red-900/80 block">
                Diretriz Primária
              </label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm focus:border-red-900/50 focus:outline-none transition-colors uppercase appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled className="text-zinc-700">SELECIONE</option>
                <option value="Sobrevivência">Sobrevivência</option>
                <option value="Força Bruta">Força Bruta</option>
                <option value="Inteligência">Inteligência</option>
                <option value="Velocidade">Velocidade</option>
                <option value="Vingança">Vingança</option>
                <option value="Conquista Global">Conquista Global</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden bg-red-900/20 border border-red-900/30 text-red-500 font-mono font-bold uppercase tracking-widest transition-all hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isSubmitting ? "Inicializando..." : "Inicializar Sistema"}
            </span>
          </button>

          <p className="text-center text-[10px] text-zinc-700 font-mono uppercase tracking-wider">
            Ao continuar, você concorda com os protocolos de segurança.
          </p>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          onComplete();
        }}
        onUpgrade={async () => {
          try {
            const response = await fetch('/api/stripe/create-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
              }),
            });

            const data = await response.json();
            if (data.url) {
              window.location.href = data.url;
            }
          } catch (error) {
            console.error('Erro ao criar checkout:', error);
          }
        }}
      />
    </div>
  );
}
