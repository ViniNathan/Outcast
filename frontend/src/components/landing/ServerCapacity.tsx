'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Database } from 'lucide-react';

export const ServerCapacity = () => {
  const [timeLeft, setTimeLeft] = useState('');
  const [capacity, setCapacity] = useState(94);

  useEffect(() => {
    // Capacity fluctuation effect
    const capInterval = setInterval(() => {
      setCapacity(prev => {
        const change = Math.random() > 0.6 ? 1 : -0.5;
        const next = Math.min(99.9, Math.max(92, prev + change));
        return Number(next.toFixed(1));
      });
    }, 3000);

    // Countdown effect (Reset at midnight or fake 2 hour cycle)
    const timerInterval = setInterval(() => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999); // Midnight reset
      
      const diff = end.getTime() - now.getTime();
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => {
      clearInterval(capInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto mt-8 font-mono">
        {/* Capacity Bar */}
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-2"><Database size={10} /> Capacidade do Servidor</span>
                <span className={capacity > 98 ? 'text-red-500 animate-pulse' : 'text-red-400'}>{capacity}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-900 overflow-hidden">
                <div 
                    className="h-full bg-red-700 transition-all duration-1000 ease-out"
                    style={{ width: `${capacity}%` }} 
                />
            </div>
            {capacity > 97 && (
                <p className="text-[10px] text-red-500 text-right animate-pulse">ALERTA: VAGAS LIMITADAS PARA O CICLO ATUAL</p>
            )}
        </div>

        {/* Countdown */}
        <div className="border border-red-900/30 bg-red-950/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400/80">
                <Clock size={14} />
                <span className="text-[10px] uppercase tracking-widest">Reset do Ranking</span>
            </div>
            <span className="text-lg font-bold text-red-500 tracking-widest">{timeLeft}</span>
        </div>
    </div>
  );
};
