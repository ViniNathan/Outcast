import React, { useState } from 'react';
import { PlayerStat, Quest } from '@/types/dashboard';
import { User, AlertTriangle, Check } from 'lucide-react';

const INITIAL_STATS: PlayerStat[] = [
  { label: 'FORÇA', value: 12, code: 'FOR' },
  { label: 'AGILIDADE', value: 14, code: 'AGI' },
  { label: 'SENTIDOS', value: 11, code: 'SEN' },
  { label: 'VITALIDADE', value: 10, code: 'VIT' },
  { label: 'INTELIG', value: 9, code: 'INT' },
];

const INITIAL_QUESTS: Quest[] = [
  { id: 1, title: 'FLEXÕES', current: 50, total: 100, unit: '', completed: false },
  { id: 2, title: 'ABDOMINAIS', current: 20, total: 100, unit: '', completed: false },
  { id: 3, title: 'AGACHAMENTOS', current: 80, total: 100, unit: '', completed: false },
  { id: 4, title: 'CORRIDA', current: 5, total: 10, unit: 'km', completed: false },
];

export const Dashboard: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);

  const toggleQuest = (id: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        const isNowComplete = !q.completed;
        return {
          ...q,
          completed: isNowComplete,
          current: isNowComplete ? q.total : Math.floor(q.total / 2) // Demo logic: reset to 50% or full
        };
      }
      return q;
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-4 mb-8 gap-4">
        <div>
          <h2 className="text-zinc-500 text-xs font-mono mb-1 tracking-widest">STATUS DO JOGADOR</h2>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tighter">JANELA_01</h1>
        </div>
        <div className="flex gap-4 font-mono text-xs text-zinc-600">
           {/* Rank removed from here to be placed prominently below */}
          <span>FADIGA: <span className="text-zinc-400">0%</span></span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COL: IDENTITY */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AVATAR BOX */}
          <div className="border border-zinc-800 bg-zinc-900/10 p-1 relative aspect-square flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-50" />
            <User size={64} className="text-zinc-800 group-hover:text-red-900/50 transition-colors duration-500" strokeWidth={1} />
            
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-600" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-600" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600" />
          </div>

          {/* IDENTITY CARD */}
          <div className="border border-zinc-800 p-6 space-y-6 bg-black relative overflow-hidden">
             {/* RANK WATERMARK */}
             <div className="absolute top-4 right-6 flex flex-col items-center pointer-events-none opacity-90">
                <span className="text-[10px] text-zinc-600 font-mono mb-[-5px]">RANK</span>
                <span className="text-6xl font-black text-red-900 drop-shadow-[0_0_10px_rgba(127,29,29,0.5)]">E</span>
             </div>

             <div className="space-y-1 relative z-10">
               <span className="text-[10px] text-zinc-600 font-mono block">NOME</span>
               <span className="text-2xl text-zinc-200 font-bold tracking-wide">OUTCAST</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 relative z-10">
               <div className="space-y-1">
                 <span className="text-[10px] text-zinc-600 font-mono block">NÍVEL</span>
                 <span className="text-xl text-zinc-300 font-mono">1</span>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] text-zinc-600 font-mono block">CLASSE</span>
                 <span className="text-xl text-zinc-500 font-mono">NENHUMA</span>
               </div>
             </div>

             <div className="space-y-1 relative z-10">
               <span className="text-[10px] text-zinc-600 font-mono block">TÍTULO</span>
               <span className="text-sm text-zinc-500 uppercase">Matador de Lobos</span>
             </div>
          </div>

          {/* VITALS */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>HP</span>
                <span>100/100</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 border border-zinc-800">
                <div className="h-full bg-red-900 w-full shadow-[0_0_10px_rgba(127,29,29,0.3)]" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>MP</span>
                <span>35/35</span>
              </div>
              <div className="h-3 w-full bg-zinc-950 border border-zinc-800">
                <div className="h-full bg-blue-900/60 w-full shadow-[0_0_10px_rgba(30,58,138,0.3)]" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: CONTENT */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* STATS GRID */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {INITIAL_STATS.map((stat) => (
                <div key={stat.code} className="border border-zinc-900 p-4 hover:border-red-900/30 transition-colors group bg-zinc-950/30 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-zinc-600 font-mono mb-2 group-hover:text-red-800 transition-colors">
                    {stat.code}
                  </div>
                  <div className="text-3xl font-bold text-zinc-300 font-mono">
                    {String(stat.value).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Available Points - MORE VISIBLE */}
            <div className="w-full bg-zinc-900/30 border border-dashed border-zinc-800 p-4 flex justify-between items-center group hover:border-red-900/30 transition-colors">
               <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">PONTOS DISPONÍVEIS</span>
               <span className="text-xl font-bold font-mono text-red-600 animate-pulse">
                  0 <span className="inline-block w-2 h-4 bg-red-600 ml-1 animate-blink"></span>
               </span>
            </div>
          </div>

          {/* ACTIVE QUEST PANEL */}
          <div className="border border-zinc-800 relative overflow-hidden bg-black">
            {/* Header */}
            <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-center">
               <span className="text-red-600 font-bold text-sm tracking-widest flex items-center gap-2">
                 <AlertTriangle size={16} /> LOG DE MISSÕES
               </span>
               <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 border border-zinc-800">
                 DIFICULDADE: E
               </span>
            </div>

            <div className="p-6">
              <h3 className="text-2xl text-zinc-100 mb-2 uppercase tracking-tight font-bold">Missão Diária: Preparação</h3>
              <p className="text-zinc-500 text-xs font-mono mb-8 border-b border-zinc-900 pb-4 leading-relaxed">
                Complete o treinamento físico para fortalecer seu receptáculo. <br/>
                <span className="text-red-900/80">O fracasso resultará em punição severa na Zona de Penalidade.</span>
              </p>

              <div className="space-y-6">
                {quests.map((quest) => {
                  const percent = (quest.current / quest.total) * 100;
                  return (
                    <div 
                      key={quest.id} 
                      onClick={() => toggleQuest(quest.id)}
                      className={`group cursor-pointer select-none transition-all duration-300 ${quest.completed ? 'opacity-50 grayscale' : 'opacity-100'}`}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-zinc-300 font-bold tracking-wider flex items-center gap-3 group-hover:text-red-500 transition-colors">
                          {/* Custom Checkbox */}
                          <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                            quest.completed ? 'bg-zinc-800 border-zinc-600' : 'border-zinc-700 bg-black group-hover:border-red-600'
                          }`}>
                            {quest.completed && <Check size={12} className="text-zinc-400" />}
                          </div>
                          {quest.title}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {quest.current}/{quest.total} {quest.unit}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-4 w-full bg-zinc-950 border border-zinc-900 relative overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ease-out ${quest.completed ? 'bg-zinc-600' : 'bg-red-900'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Footer */}
            <div className="bg-red-950/5 border-t border-red-900/20 p-4 text-center">
              <span className="text-xs text-red-800 font-mono uppercase animate-pulse font-bold tracking-widest">
                Tempo Restante: 14:02:59
              </span>
            </div>
          </div>

        </div>
      </div>
      
      {/* SYSTEM TICKER */}
      <div className="fixed bottom-0 right-0 w-full md:w-auto md:max-w-sm bg-black border-t md:border-l md:border-t border-zinc-900 p-2 z-50">
         <div className="font-mono text-[10px] text-zinc-600 h-6 overflow-hidden flex items-center">
            <span className="mr-2 text-green-900">{`>`}</span>
            <span className="animate-pulse">Monitoramento do sistema ativo...</span>
         </div>
      </div>

    </div>
  );
};