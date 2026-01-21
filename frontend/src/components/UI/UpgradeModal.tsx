'use client';

import React from 'react';
import {Crown, Zap, Trophy, Brain } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-black border-2 border-red-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com efeito de brilho */}
        <div className="bg-red-950/20 border-b-2 border-red-900/30 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent animate-pulse pointer-events-none" />      
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={32} className="text-red-500" />
              <h2 className="text-3xl font-bold text-red-500 uppercase tracking-tight">
                ACESSO NEGADO
              </h2>
            </div>
            <p className="text-zinc-400 font-mono text-sm">
              Você ainda não provou que merece o Rank S. Continue sendo um NPC ou evolua.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Benefícios */}
          <div>
            <div className="text-xs font-mono text-zinc-600 uppercase mb-4 tracking-widest">
              O QUE VOCÊ PERDE ENQUANTO FICA NO RANK E
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3 p-4 border border-zinc-900 bg-zinc-950/50 hover:border-red-900/30 transition-colors">
                <Brain size={24} className="text-red-500 shrink-0 mt-1" />
                <div>
                  <h4 className="text-zinc-200 font-bold text-sm uppercase tracking-wide mb-1">
                    Oráculo IA Ilimitado
                  </h4>
                  <p className="text-zinc-500 text-xs">
                    O treinador que analisa suas falhas, cria missões personalizadas e <span className="text-red-500">humilha suas desculpas</span>. Sem limites.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-4 border border-zinc-900 bg-zinc-950/50 hover:border-red-900/30 transition-colors">
                <Trophy size={24} className="text-red-500 shrink-0 mt-1" />
                <div>
                  <h4 className="text-zinc-200 font-bold text-sm uppercase tracking-wide mb-1">
                    Ranking & Guilds Globais
                  </h4>
                  <p className="text-zinc-500 text-xs">
                    Veja sua posição real entre os outros. <span className="text-red-500">Prove que você não é um NPC</span> e domine o ranking global.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-4 border border-zinc-900 bg-zinc-950/50 hover:border-red-900/30 transition-colors">
                <Zap size={24} className="text-red-500 shrink-0 mt-1" />
                <div>
                  <h4 className="text-zinc-200 font-bold text-sm uppercase tracking-wide mb-1">
                    Auto Geração de Missões
                  </h4>
                  <p className="text-zinc-500 text-xs">
                    O sistema nunca te deixa descansar. <span className="text-red-500">Novas missões geradas automaticamente</span> quando você completa todas. Sem desculpas.
                  </p>
                </div>
              </li>

            </ul>
          </div>

          {/* Preço */}
          <div className="border border-red-900/30 bg-red-950/10 p-6">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-5xl font-bold text-white font-mono">R$ 29,90</span>
              <span className="text-lg text-red-400/70">/mês</span>
            </div>
            <p className="text-center text-xs text-zinc-500 font-mono">
              Investimento mínimo para dominar o sistema. Cancele quando desistir.
            </p>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full py-4 bg-red-900 hover:bg-red-700 text-white transition-all uppercase font-mono text-sm tracking-widest font-bold relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Crown size={20} />
                DOMINAR O SISTEMA
              </span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out skew-x-12" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors uppercase font-mono text-xs tracking-widest"
            >
              Continuar sendo um NPC
            </button>
          </div>

          {/* Garantia */}
          <div className="text-center pt-4 border-t border-zinc-900">
            <p className="text-[10px] text-zinc-700 uppercase font-mono tracking-widest">
              Processamento seguro via Stripe • O sistema não aceita desculpas, mas aceita cancelamento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
