"use client";

import React, { useState } from 'react';
import { TerminalEntry } from '../components/TerminalEntry';
import { SystemInterface } from '../components/SystemInterface';
import { ScanlineOverlay } from '../components/UI/ScanlineOverlay';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'BOOT' | 'ACTIVE'>('BOOT');

  const handleAccept = () => {
    setSystemState('ACTIVE');
  };

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 font-mono selection:bg-red-900 selection:text-white overflow-hidden">
      <ScanlineOverlay />
      
      <main className="relative z-10 w-full min-h-screen flex flex-col">
        {systemState === 'BOOT' ? (
          <TerminalEntry onComplete={handleAccept} />
        ) : (
          <SystemInterface />
        )}
      </main>

      {/* Decorative corners */}
      <div className="fixed top-0 left-0 p-4 z-50 pointer-events-none text-[10px] text-zinc-800">
        SYS.VER.9.0.1
      </div>
      <div className="fixed top-0 right-0 p-4 z-50 pointer-events-none text-[10px] text-red-900 animate-pulse">
        ● REC
      </div>
      <div className="fixed bottom-0 left-0 p-4 z-50 pointer-events-none text-[10px] text-zinc-800">
        ID: UNKNOWN
      </div>
    </div>
  );
};

export default App;