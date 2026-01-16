import React, { useEffect, useState } from 'react';
import { MISSION_LOGS, SYSTEM_MESSAGES } from '@/utils/constants';
import { Radio, Activity, AlertTriangle } from 'lucide-react';

interface SystemInterfaceProps {
  onAwaken: () => void;
}

export const SystemInterface: React.FC<SystemInterfaceProps> = ({ onAwaken }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay slightly to handle transition from boot
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className={`w-full max-w-4xl mx-auto px-6 py-24 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* 1. HERO SECTION */}
      <section className="mb-32 relative border-l border-zinc-900 pl-8 md:pl-16 py-8">
        <div className="absolute -left-[1px] top-0 h-16 w-[2px] bg-red-900" />
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-zinc-200 uppercase tracking-tighter mb-6 leading-[0.9]">
          Você não é <span className="text-zinc-600 line-through decoration-red-900/50">fraco</span>. <br />
          Você nunca foi <span className="text-red-700">testado</span>.
        </h1>
        
        <div className="max-w-xl">
          <p className="text-zinc-500 text-lg md:text-xl font-mono border-l-2 border-zinc-800 pl-4 py-1 mt-8">
            OUTCAST transforma sua vida em um sistema de progressão real. <br />
            <span className="text-zinc-400">Missões. Ranking. Consequências.</span>
          </p>
        </div>
      </section>

      {/* 2. MECHANICS / LOGS */}
      <section className="mb-32 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="font-mono text-sm text-zinc-600 mb-4 col-span-full flex items-center gap-2">
           <Activity size={14} className="text-red-900" /> LOG_MECANICAS.SISTEMA
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

      {/* 3. SOCIAL PROOF / PRESSURE */}
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

      {/* 4. FINAL CTA */}
      <section className="flex flex-col items-center justify-center text-center py-20 relative">
        <div className="absolute inset-0 bg-red-950/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center z-10 gap-6">
          <div className="flex items-center gap-2 text-green-900/80 animate-pulse mb-4">
            <Radio size={14} />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">O sistema está ativo</span>
          </div>

          <button 
            onClick={onAwaken}
            className="group relative bg-zinc-950 hover:bg-black border border-zinc-800 hover:border-red-600 text-zinc-300 hover:text-red-500 transition-all duration-500 w-full md:w-auto min-w-[300px] px-8 py-6 uppercase font-bold tracking-[0.15em] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3 cursor-pointer">
              DESPERTAR AGORA
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