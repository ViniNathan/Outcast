'use client';

import React, { useEffect, useState } from 'react';
import { MISSION_LOGS, SYSTEM_MESSAGES } from '@/utils/constants';
import { Radio, Activity, AlertTriangle, Zap, Brain, Target, Shield, Check, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SystemInterfaceProps {
  onAwaken: () => void;
  isFirstAccess: boolean;
}

export const SystemInterface: React.FC<SystemInterfaceProps> = ({ onAwaken, isFirstAccess }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Delay slightly to handle transition from boot
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleAccess = () => {
    if (status === 'authenticated') {
      onAwaken();
      return;
    }
    router.push('/login');
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-6 py-24 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

      {/* Top-right access shortcut */}
      <div className="fixed top-0 right-0 p-4 z-50">
        <button
          type="button"
          onClick={handleAccess}
          className="border-2 border-red-600 bg-black/60 backdrop-blur px-4 py-2 text-[15px] font-mono tracking-[0.25em] text-white hover:text-red-500 hover:border-red-600 transition-colors uppercase"
        >
          ACESSAR
        </button>
      </div>
      
      {/* 1. HERO SECTION */}
      <section className="mb-32 relative border-l border-zinc-900 pl-8 md:pl-16 py-8">
        <div className="absolute -left-[1px] top-0 h-16 w-[2px] bg-red-900" />
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-zinc-200 uppercase tracking-tighter mb-6 leading-[0.9]">
          Você não é <span className="text-zinc-600 line-through decoration-red-900/50">fraco</span>. <br />
          Você nunca foi <span className="text-red-700">testado</span>.
        </h1>
        
        <div className="max-w-xl">
          <p className="text-zinc-500 text-lg md:text-xl font-mono border-l-2 border-zinc-800 pl-4 py-1 mt-8">
            <span className="text-red-700">OUTCAST</span> transforma sua vida em um sistema de progressão real. <br />
            <span className="text-zinc-400">Missões. Ranking. Consequências.</span>
          </p>
        </div>
      </section>

      {/* 2. MECHANICS / LOGS */}
      <section className="mb-32 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="font-mono text-sm text-zinc-600 mb-4 col-span-full flex items-center gap-2 uppercase tracking-widest">
           <Activity size={14} className="text-red-900" /> [LOGS_SISTEMA_V9]
        </div>

        <div className="col-span-full border-t border-b border-zinc-900 py-8">
          {MISSION_LOGS.map((log) => (
            <div key={log.id} className="group flex items-center justify-between py-4 border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-700 font-mono">0{log.id}</span>
                <span className="text-zinc-300 font-medium tracking-wide">{log.text}</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-1 border ${
                log.status === 'AVISO' ? 'border-red-900/30 text-red-900' : 'border-zinc-800 text-zinc-600'
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. NEW FEATURE MODULES */}
      <section className="mb-32">
        <div className="flex items-center gap-2 mb-8">
          <Zap size={16} className="text-red-600" />
          <h2 className="text-xl font-bold text-zinc-200 uppercase tracking-tight">Módulos de Combate</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Card 1 */}
           <div className="border border-zinc-800 bg-zinc-950/50 p-6 hover:border-red-900/50 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Target size={40} className="text-red-900" strokeWidth={1} />
              </div>
              <h3 className="font-mono text-red-500 mb-2 text-sm uppercase">01. Protocolo de Missões</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Transforme hábitos mundanos em <span className="text-zinc-200">Quests de Rank-S</span>. 
                Receba XP, suba de nível e desbloqueie títulos baseados na sua consistência real.
              </p>
           </div>

           {/* Card 2 */}
           <div className="border border-zinc-800 bg-zinc-950/50 p-6 hover:border-red-900/50 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Brain size={40} className="text-red-900" strokeWidth={1} />
              </div>
              <h3 className="font-mono text-red-500 mb-2 text-sm uppercase">02. Oráculo IA</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Um treinador pessoal movido a Inteligência Artificial que analisa suas falhas, cria treinos personalizados e 
                <span className="text-zinc-200"> humilha suas desculpas</span>.
              </p>
           </div>

           {/* Card 3 */}
           <div className="border border-zinc-800 bg-zinc-950/50 p-6 hover:border-red-900/50 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Activity size={40} className="text-red-900" strokeWidth={1} />
              </div>
              <h3 className="font-mono text-red-500 mb-2 text-sm uppercase">03. Métricas Vitais</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Visualize seus atributos reais (FOR, INT, VIT). O sistema converte seus dados em um 
                <span className="text-zinc-200"> Gráfico de Radar Hexagonal</span> para identificar suas fraquezas.
              </p>
           </div>

           {/* Card 4 */}
           <div className="border border-zinc-800 bg-zinc-950/50 p-6 hover:border-red-900/50 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Shield size={40} className="text-red-900" strokeWidth={1} />
              </div>
              <h3 className="font-mono text-red-500 mb-2 text-sm uppercase">04. Guilda Global</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Compare seu nível com outros &quot;jogadores&quot;. Suba no ranking global. 
                <span className="text-zinc-200"> Prove que você não é um NPC.</span>
              </p>
           </div>
        </div>
      </section>

      {/* 4. PRICING / ACCESS LEVEL */}
      <section className="mb-32">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-100 uppercase tracking-tighter mb-4">Autorização de Acesso</h2>
            <p className="text-zinc-500 font-mono text-sm">Escolha sua dificuldade.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* FREE TIER */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-8 flex flex-col relative group">
               <div className="absolute top-0 left-0 bg-zinc-800 text-black text-[10px] font-bold px-2 py-1 font-mono uppercase">
                 Fracassado
               </div>
               <h3 className="text-2xl font-bold text-zinc-400 mb-2">RANK E</h3>
               <div className="text-4xl font-bold text-zinc-200 mb-6 font-mono">
                 R$ 0<span className="text-sm text-zinc-600 font-normal">/mês</span>
               </div>
               
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex items-center gap-3 text-sm text-zinc-400">
                   <Check size={14} className="text-zinc-500" /> Missões Diárias Manuais
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-400">
                   <Check size={14} className="text-zinc-500" /> Status Básico
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-600 line-through decoration-zinc-800">
                   <X size={14} /> Acesso ao Oráculo IA
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-600 line-through decoration-zinc-800">
                   <X size={14} /> Ranking Global
                 </li>
               </ul>

               <button 
            onClick={handleAccess}
                 className="w-full py-4 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors uppercase font-mono text-xs tracking-widest"
               >
                 Iniciar Sobrevivência
               </button>
            </div>

            {/* PRO TIER */}
            <div className="border border-red-900 bg-red-950/10 p-8 flex flex-col relative overflow-hidden transform md:-translate-y-4">
               {/* Glowing Background */}
               <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
               <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-600/20 to-transparent pointer-events-none" />

               <div className="absolute top-0 left-0 bg-red-700 text-white text-[10px] font-bold px-2 py-1 font-mono uppercase shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                 Monarca
               </div>
               
               <h3 className="text-2xl font-bold text-red-500 mb-2 drop-shadow-md">RANK S</h3>
               <div className="text-4xl font-bold text-white mb-6 font-mono flex items-baseline gap-2">
                 R$ 29,90<span className="text-sm text-red-400/70 font-normal">/mês</span>
               </div>
               
               <ul className="space-y-4 mb-8 flex-1 relative z-10">
                 <li className="flex items-center gap-3 text-sm text-zinc-200 font-medium">
                   <Check size={14} className="text-red-500" /> <span className="text-red-100">Oráculo IA Ilimitado</span>
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300">
                   <Check size={14} className="text-red-500" /> Geração de Treino Adaptativo
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300">
                   <Check size={14} className="text-red-500" /> Ranking & Guildas Globais
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300">
                   <Check size={14} className="text-red-500" /> Estatísticas Avançadas
                 </li>
                 <li className="flex items-center gap-3 text-sm text-zinc-300">
                   <Check size={14} className="text-red-500" /> Insígnia &quot;Desperto&quot;
                 </li>
               </ul>

               <button 
                onClick={handleAccess}
                className="w-full py-4 bg-red-900 hover:bg-red-700 text-white transition-all uppercase font-mono text-xs tracking-widest font-bold relative overflow-hidden group"
               >
                 <span className="relative z-10">Dominar o Sistema</span>
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out skew-x-12" />
               </button>
            </div>

         </div>
      </section>

      {/* 5. SOCIAL PROOF / PRESSURE */}
      <section className="mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {SYSTEM_MESSAGES.map((msg, idx) => (
            <div key={idx} className="bg-zinc-900/10 border border-zinc-900 p-8 flex flex-col justify-between h-48 hover:border-red-900/30 transition-colors group">
              <AlertTriangle size={16} className="text-zinc-800 mb-4 group-hover:text-red-900/50 transition-colors" />
              <p className="text-zinc-400 font-mono text-sm leading-relaxed uppercase tracking-wider">
                {msg}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="flex flex-col items-center justify-center text-center py-20 relative">
        <div className="absolute inset-0 bg-red-950/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center z-10 gap-6">
          <div className="flex items-center gap-2 text-green-900/80 animate-pulse mb-4">
            <Radio size={14} />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">O sistema aguarda sua resposta</span>
          </div>

          <button 
            onClick={handleAccess}
            className="group relative bg-zinc-950 hover:bg-black border border-zinc-800 hover:border-red-600 text-zinc-300 hover:text-red-500 transition-all duration-500 w-full md:w-auto min-w-[300px] px-8 py-6 uppercase font-bold tracking-[0.15em] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              ACEITAR MISSÃO
            </span>
            
            {/* Hover Glitch Effect Background */}
            <div className="absolute inset-0 bg-red-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            {/* Tech Decoration */}
            <div className="absolute bottom-0 right-0 p-1">
               <div className="w-2 h-2 bg-zinc-800 group-hover:bg-red-600 transition-colors" />
            </div>
          </button>
          
          <div className="mt-8 flex gap-8 text-zinc-800 font-mono text-[10px]">
             <span>SERVIDOR: SA_EAST_1</span>
             <span>PING: 14ms</span>
             <span>CAPACIDADE: 94%</span>
          </div>
        </div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="border-t border-zinc-900 pt-8 pb-4 text-center">
        <p className="text-[10px] text-zinc-800 uppercase tracking-widest">
          Outcast System © 2024. Todas as fraquezas registradas.
        </p>
      </footer>
    </div>
  );
};