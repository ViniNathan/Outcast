'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Activity } from 'lucide-react';

const ACTIONS = [
  'COMPLETOU MISSÃO: "PROTOCOLO MATINAL"',
  'SUBIU DE NÍVEL: RANK D -> RANK C',
  'FALHOU: PENALIDADE APLICADA',
  'INICIOU SESSÃO: SÃO PAULO/BR',
  'ADQUIRIU: "MODULO DE FOCO"',
  'ELIMINOU HÁBITO: "REDES SOCIAIS"',
  'DESBLOQUEOU: INSÍGNIA "ESTÓICO"',
  'SINCROZINOU: DADOS BIOMÉTRICOS',
  'ACEITOU O CONTRATO',
];

const USERS = [
  'AGENTE_3392', 'USER_X99', 'SHADOW_01', 'RONIN_DEV', 'KAI_ZEN',
  'SYSTEM_OP', 'GHOST_HQ', 'ECHO_5', 'NULL_POINTER'
];

interface LogEntry {
  id: number;
  text: string;
  time: string;
  type: 'success' | 'warning' | 'neutral';
}

export const SystemLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial population
  useEffect(() => {
    const initialLogs = Array.from({ length: 5 }).map((_, i) => createRandomLog(i));
    setLogs(initialLogs);
  }, []);

  // Add new logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = createRandomLog(Date.now());
        const newLogs = [...prev, newLog];
        if (newLogs.length > 8) newLogs.shift(); // Keep only last 8
        return newLogs;
      });
    }, 2500); // New log every 2.5s

    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const createRandomLog = (id: number): LogEntry => {
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const type = action.includes('FALHOU') ? 'warning' : action.includes('COMPLETOU') || action.includes('SUBIU') ? 'success' : 'neutral';
    
    return {
      id,
      text: `[${user}] ${action}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      type
    };
  };

  return (
    <div className="w-full border-t border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-sm py-4">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
        <div className="flex items-center gap-2 text-red-600 animate-pulse whitespace-nowrap">
          <Activity size={14} />
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold">LIVE FEED</span>
        </div>
        
        <div className="h-6 w-[1px] bg-zinc-800" />
        
        <div className="flex-1 overflow-hidden h-6 relative">
          {/* We show just the latest log in a ticker style for mobile, or list for desktop? 
              The requirement said "ticker". A horizontal marquee or a fading list.
              Let's do a vertical crossfade of the latest log for clean UI.
          */}
          <div className="absolute inset-0 flex flex-col justify-center">
             {logs.length > 0 && (
                <div key={logs[logs.length - 1].id} className="animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center justify-between w-full">
                    <span className="font-mono text-xs text-zinc-400 truncate">
                        <span className="text-zinc-600 mr-3">[{logs[logs.length - 1].time}]</span>
                        {logs[logs.length - 1].text}
                    </span>
                    <span className={`text-[9px] uppercase border px-1 ${
                        logs[logs.length - 1].type === 'warning' ? 'border-red-900 text-red-500' : 
                        logs[logs.length - 1].type === 'success' ? 'border-green-900 text-green-500' : 
                        'border-zinc-800 text-zinc-600'
                    }`}>
                        {logs[logs.length - 1].type === 'warning' ? 'CRÍTICO' : 'SYNC'}
                    </span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
