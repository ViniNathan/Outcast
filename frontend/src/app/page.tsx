'use client';

import React, { useState } from 'react';
import { TerminalEntry } from '@/components/TerminalEntry';
import { SystemInterface } from '@/components/SystemInterface';
import { Dashboard } from '@/components/dashbooard/Dashboard';
import { ScanlineOverlay } from '@/components/UI/ScanlineOverlay';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'BOOT' | 'LANDING' | 'DASHBOARD'>('BOOT');

  const handleBootComplete = () => {
    setSystemState('LANDING');
  };

  const handleAwaken = () => {
    // Optional: Add a transition sound or effect here
    setSystemState('DASHBOARD');
  };

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 font-mono selection:bg-red-900 selection:text-white overflow-hidden">
      <ScanlineOverlay />
      
      <main className="relative z-10 w-full min-h-screen flex flex-col">
        {systemState === 'BOOT' && (
          <TerminalEntry onComplete={handleBootComplete} />
        )}
        
        {systemState === 'LANDING' && (
          <SystemInterface onAwaken={handleAwaken} />
        )}

        {systemState === 'DASHBOARD' && (
          <Dashboard />
        )}
      </main>

      {/* Decorative corners */}
      <div className="fixed top-0 left-0 p-4 z-50 pointer-events-none text-[10px] text-zinc-800">
        SIS.VER.9.0.1
      </div>
      <div className="fixed top-0 right-0 p-4 z-50 pointer-events-none text-[10px] text-red-900 animate-pulse">
        {systemState === 'DASHBOARD' ? '● MONITORAMENTO VIVO' : '● GRAVANDO'}
      </div>
      <div className="fixed bottom-0 left-0 p-4 z-50 pointer-events-none text-[10px] text-zinc-800">
        ID: {systemState === 'DASHBOARD' ? 'JOGADOR_01' : 'DESCONHECIDO'}
      </div>
    </div>
  );
};

export default App;