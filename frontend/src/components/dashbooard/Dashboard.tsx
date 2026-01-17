import React, { useState, useRef, useEffect } from 'react';
import { PlayerStat, Quest, ChatMessage, RankEntry } from '@/types/dashboard';
import { 
  User, AlertTriangle, Check, Trophy, MessageSquare, 
  Activity, Settings, Send, Lock, Cpu, Share2, Menu, X
} from 'lucide-react';

// --- DATA CONSTANTS ---
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

const MOCK_RANKING: RankEntry[] = [
  { rank: 1, name: 'SUNG JIN-WOO', level: 146, job: 'MONARCA DAS SOMBRAS' },
  { rank: 2, name: 'THOMAS ANDRE', level: 130, job: 'GOLIATH' },
  { rank: 3, name: 'LIU ZHIGANG', level: 128, job: 'HERÓI DA CHINA' },
  { rank: 4, name: 'GOTO RYUJI', level: 115, job: 'ESPADACHIM' },
  { rank: 5, name: 'CHA HAE-IN', level: 112, job: 'MESTRE DA ESPADA' },
  { rank: 9999, name: 'OUTCAST', level: 1, job: 'NENHUMA', isUser: true },
];

// --- MAIN COMPONENT ---
export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE'>('STATUS');
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile State
  const [playerName, setPlayerName] = useState('OUTCAST');
  const [playerTitle, setPlayerTitle] = useState('Matador de Lobos');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'SYSTEM', text: 'O Oráculo está online. Solicite uma diretriz de missão ou análise de combate.', timestamp: new Date() }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  // Handlers
  const toggleQuest = (id: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        const isNowComplete = !q.completed;
        return {
          ...q,
          completed: isNowComplete,
          current: isNowComplete ? q.total : Math.floor(q.total / 2)
        };
      }
      return q;
    }));
  };

  const handleSelectTab = (tab: 'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'USER', text: chatInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate AI Latency
    setTimeout(() => {
      const responses = [
        "CALCULANDO VIABILIDADE...",
        "SEU NÍVEL ATUAL É INSUFICIENTE PARA ESSA QUESTÃO.",
        "NOVA MISSÃO GERADA: SOBREVIVA.",
        "ANÁLISE CONCLUÍDA: VOCÊ PRECISA DE MAIS FORÇA.",
        "O SISTEMA RECONHECE SUA AMBIÇÃO. MAS NÃO SUA CAPACIDADE."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const sysMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'SYSTEM', 
        text: randomResponse, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, sysMsg]);
    }, 1500);
  };

  // --- SUB-VIEWS ---

  const renderStatus = () => {
    const missionLog = (
      <div className="border border-zinc-800 relative overflow-hidden bg-black">
        <div className="bg-zinc-900/50 p-3 sm:p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-red-600 font-bold text-sm tracking-widest flex items-center gap-2 flex-wrap">
              <AlertTriangle size={16} /> LOG DE MISSÕES
            </span>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 border border-zinc-800">
              DIFICULDADE: E
            </span>
        </div>

        <div className="p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl text-zinc-100 mb-2 uppercase tracking-tight font-bold">Missão Diária: Preparação</h3>
          <p className="text-zinc-500 text-xs font-mono mb-6 sm:mb-8 border-b border-zinc-900 pb-4 leading-relaxed">
            Complete o treinamento físico para fortalecer seu receptáculo.
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                    <span className="text-sm text-zinc-300 font-bold tracking-wider flex items-center gap-3 group-hover:text-red-500 transition-colors break-words">
                      <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                        quest.completed ? 'bg-zinc-800 border-zinc-600' : 'border-zinc-700 bg-black group-hover:border-red-600'
                      }`}>
                        {quest.completed && <Check size={12} className="text-zinc-400" />}
                      </div>
                      <span className="flex-1 min-w-0 break-words">{quest.title}</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-500 shrink-0">
                      {quest.current}/{quest.total} {quest.unit}
                    </span>
                  </div>
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
        <div className="bg-red-950/5 border-t border-red-900/20 p-4 text-center">
          <span className="text-xs text-red-800 font-mono uppercase animate-pulse font-bold tracking-widest">
            Tempo Restante: 14:02:59
          </span>
        </div>
      </div>
    );

    const identityCard = (
      <div className="border border-zinc-800 p-5 sm:p-6 space-y-6 bg-black relative overflow-hidden">
          <div className="absolute top-4 right-6 flex flex-col items-center pointer-events-none opacity-90">
            <span className="text-[10px] text-zinc-600 font-mono mb-[-5px]">RANK</span>
            <span className="text-5xl sm:text-6xl font-black text-red-900 drop-shadow-[0_0_10px_rgba(127,29,29,0.5)]">E</span>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-zinc-600 font-mono block">NOME</span>
            <span className="text-xl sm:text-2xl text-zinc-200 font-bold tracking-wide break-words leading-tight">{playerName}</span>
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
            <span className="text-sm text-zinc-500 uppercase break-words">{playerTitle}</span>
          </div>
      </div>
    );

    const statsPanel = (
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {INITIAL_STATS.map((stat) => (
            <div key={stat.code} className="border border-zinc-900 p-3 sm:p-4 hover:border-red-900/30 transition-colors group bg-zinc-950/30 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] text-zinc-600 font-mono mb-2 group-hover:text-red-800 transition-colors">
                {stat.code}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-300 font-mono">
                {String(stat.value).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full bg-zinc-900/30 border border-dashed border-zinc-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group hover:border-red-900/30 transition-colors">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">PONTOS DISPONÍVEIS</span>
            <span className="text-xl font-bold font-mono text-red-600 animate-pulse">
              0 <span className="inline-block w-2 h-4 bg-red-600 ml-1 animate-blink"></span>
            </span>
        </div>
      </div>
    );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* MOBILE ORDER:
            1) Log de missões
            2) Card nome/rank/título
            3) Pontos de status */}
        <div className="lg:hidden space-y-6">
          {missionLog}
          {identityCard}
          {statsPanel}
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-zinc-800 bg-zinc-900/10 p-1 relative aspect-square flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-50" />
              <User size={64} className="text-zinc-800 group-hover:text-red-900/50 transition-colors duration-500" strokeWidth={1} />
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-600" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-600" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600" />
            </div>

            {identityCard}

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

          <div className="lg:col-span-8 space-y-8">
            {statsPanel}
            {missionLog}
          </div>
        </div>
      </div>
    );
  };

  const renderRanking = () => (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8 border-l-4 border-red-800 pl-4">
        <h2 className="text-3xl font-bold text-zinc-100 uppercase tracking-tighter">Classificação Global</h2>
        <p className="text-zinc-500 font-mono text-sm mt-1">Comparando seu poder insignificante com a elite.</p>
      </div>

      {/* SHARE CARD SECTION */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-zinc-900/10 p-6 border border-zinc-800/50">
         
         {/* THE CARD */}
         <div className="relative aspect-[1.58/1] bg-black border border-zinc-800 p-6 flex flex-col justify-between overflow-hidden group hover:border-red-900/50 transition-colors shadow-2xl">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(220,38,38,0.15),_transparent_60%)]" />
            <div className="absolute -right-10 -top-10 text-zinc-900/20 rotate-12 transform scale-150 pointer-events-none">
               <Trophy size={200} />
            </div>

            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 bg-red-600 animate-pulse" />
                     <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">System ID Card</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-zinc-100 uppercase tracking-tighter">{playerName}</h3>
                  <p className="text-xs font-mono text-red-500 uppercase tracking-wider mt-1">{playerTitle}</p>
               </div>
               <div className="text-right">
                  <div className="text-5xl font-black text-zinc-800/50 group-hover:text-red-900/20 transition-colors">E</div>
               </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-zinc-900 pt-4 mt-4">
               <div>
                  <span className="block text-[8px] font-mono text-zinc-600 uppercase">Nível</span>
                  <span className="text-xl font-mono text-zinc-300">01</span>
               </div>
               <div>
                  <span className="block text-[8px] font-mono text-zinc-600 uppercase">Classe</span>
                  <span className="text-xl font-mono text-zinc-500">NONE</span>
               </div>
               <div>
                  <span className="block text-[8px] font-mono text-zinc-600 uppercase">Rank</span>
                  <span className="text-xl font-mono text-red-600">E</span>
               </div>
            </div>

            <div className="relative z-10 mt-4 bg-zinc-950/80 p-3 border-l-2 border-red-900">
               <p className="text-[10px] md:text-xs font-mono text-zinc-400 italic">
                 &quot;O sistema não aceita fraqueza. Evolua ou morra.&quot;
               </p>
            </div>
         </div>

         {/* ACTIONS */}
         <div className="space-y-6">
            <div>
               <h3 className="text-lg font-bold text-zinc-200 uppercase flex items-center gap-2">
                 <Share2 size={18} className="text-red-600" />
                 Exposição controlada
               </h3>
               <p className="text-sm text-zinc-500 font-mono mt-2 leading-relaxed">
                 Exporte seu card de caçador. Mostre ao mundo seu rank atual. A vergonha pública é um excelente combustível.
               </p>
            </div>
            
            <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
               <Share2 size={14} /> Compartilhar Status
            </button>
            <p className="text-[10px] text-zinc-700 font-mono text-center">
               Gera uma imagem otimizada para Stories/Twitter.
            </p>
         </div>
      </div>

      <div className="border border-zinc-800 bg-black">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Hunter</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-2">Class</div>
        </div>
        
        {MOCK_RANKING.map((entry) => (
          <div 
            key={entry.rank} 
            className={`grid grid-cols-12 gap-4 p-4 border-b border-zinc-900 items-center ${
              entry.isUser ? 'bg-red-950/10 border-red-900/30' : 'hover:bg-zinc-900/20'
            }`}
          >
            <div className="col-span-2 font-bold font-mono text-lg">
              {entry.rank === 1 ? <span className="text-yellow-500">#1</span> : 
               entry.isUser ? <span className="text-red-600">ERROR</span> : 
               <span className="text-zinc-600">#{entry.rank}</span>}
            </div>
            <div className="col-span-6">
              <span className={`block font-bold tracking-wide ${entry.isUser ? 'text-red-500' : 'text-zinc-300'}`}>
                {entry.name}
              </span>
            </div>
            <div className="col-span-2 font-mono text-zinc-400">{entry.level}</div>
            <div className="col-span-2 text-xs font-mono text-zinc-500">{entry.job}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOracle = () => (
    <div className="w-full h-[600px] border border-zinc-800 bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-red-600" size={20} />
          <h2 className="font-bold text-zinc-200 tracking-wider">ORÁCULO DO SISTEMA</h2>
        </div>
        <span className="text-[10px] font-mono text-green-700 animate-pulse">● ONLINE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 border ${
              msg.sender === 'USER' 
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200' 
                : 'bg-black border-red-900/30 text-red-500'
            }`}>
               <div className="flex items-center gap-2 mb-2 border-b border-dashed border-zinc-700/50 pb-1">
                 <span className="text-[10px] font-mono uppercase opacity-70">
                   {msg.sender === 'USER' ? 'VOCÊ' : 'SISTEMA'}
                 </span>
                 <span className="text-[10px] font-mono opacity-50">
                   {msg.timestamp.toLocaleTimeString()}
                 </span>
               </div>
               <p className="font-mono text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Solicite uma análise ou diretriz..."
            className="flex-1 bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm focus:border-red-900 focus:outline-none transition-colors"
          />
          <button 
            onClick={handleSendMessage}
            className="bg-zinc-900 border border-zinc-800 p-3 text-zinc-400 hover:text-red-500 hover:border-red-900 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="mb-8 text-center">
          <User size={64} className="mx-auto text-zinc-700 mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100">DADOS DO RECEPTÁCULO</h2>
          <p className="text-zinc-600 font-mono text-sm mt-2">Permissão limitada de edição concedida.</p>
       </div>

       <div className="space-y-6 border border-zinc-800 p-8 bg-black">
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase">Designação (Nome)</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-zinc-900/30 border-b border-zinc-700 p-3 text-xl text-zinc-200 focus:border-red-600 focus:bg-zinc-900/50 outline-none transition-all font-bold tracking-wide"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase">Título Atual</label>
            <input 
              type="text" 
              value={playerTitle}
              onChange={(e) => setPlayerTitle(e.target.value)}
              className="w-full bg-zinc-900/30 border-b border-zinc-700 p-3 text-zinc-400 focus:border-red-600 focus:bg-zinc-900/50 outline-none transition-all font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
             <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-xs font-mono text-zinc-600 uppercase flex items-center gap-2">
                  <Lock size={10} /> Classe
                </label>
                <div className="w-full border-b border-zinc-800 p-3 text-zinc-700 font-mono uppercase">
                  Nenhuma
                </div>
             </div>
             <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-xs font-mono text-zinc-600 uppercase flex items-center gap-2">
                  <Lock size={10} /> Rank
                </label>
                <div className="w-full border-b border-zinc-800 p-3 text-red-900/50 font-bold font-mono uppercase">
                  E-Rank
                </div>
             </div>
          </div>
          
          <div className="pt-8">
            <button className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600 hover:bg-red-950/20 transition-all font-bold tracking-widest uppercase text-sm">
              Salvar Alterações
            </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
      
      {/* TOP NAVIGATION */}
      <nav className="fixed top-0 w-full left-0 right-0 z-50 flex justify-center border-b border-zinc-900 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70">
         <div className="w-full max-w-7xl px-2 sm:px-4">
           {/* Mobile top bar */}
           <div className="flex items-center justify-between md:hidden py-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">Dashboard</div>
                <div className="text-sm font-bold text-zinc-200 uppercase tracking-widest truncate">
                  {activeTab === 'STATUS' && 'Status'}
                  {activeTab === 'RANKING' && 'Ranking'}
                  {activeTab === 'ORACLE' && 'Oráculo'}
                  {activeTab === 'PROFILE' && 'Perfil'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="shrink-0 inline-flex items-center gap-2 border border-zinc-800 bg-black px-3 py-2 text-xs font-mono tracking-widest uppercase text-zinc-300 hover:border-red-900/50 hover:text-red-500 transition-colors"
                aria-label="Abrir menu"
                aria-haspopup="dialog"
                aria-expanded={isMobileMenuOpen}
                aria-controls="dashboard-mobile-menu"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                {isMobileMenuOpen ? 'Fechar' : 'Menu'}
              </button>
           </div>

           {/* Desktop tabs */}
           <div className="hidden md:flex w-full justify-center gap-1 md:gap-8 overflow-x-auto">
              <button 
                onClick={() => handleSelectTab('STATUS')}
                className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 md:px-6 py-4 border-b-2 transition-all duration-300 ${
                  activeTab === 'STATUS' 
                  ? 'border-red-600 text-red-500' 
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Activity size={16} />
                <span className="font-mono text-xs md:text-sm tracking-widest uppercase">Status</span>
              </button>
              <button 
                onClick={() => handleSelectTab('RANKING')}
                className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 md:px-6 py-4 border-b-2 transition-all duration-300 ${
                  activeTab === 'RANKING' 
                  ? 'border-red-600 text-red-500' 
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Trophy size={16} />
                <span className="font-mono text-xs md:text-sm tracking-widest uppercase">Ranking</span>
              </button>
              <button 
                onClick={() => handleSelectTab('ORACLE')}
                className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 md:px-6 py-4 border-b-2 transition-all duration-300 ${
                  activeTab === 'ORACLE' 
                  ? 'border-red-600 text-red-500' 
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <MessageSquare size={16} />
                <span className="font-mono text-xs md:text-sm tracking-widest uppercase">Oráculo</span>
              </button>
              <button 
                onClick={() => handleSelectTab('PROFILE')}
                className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 md:px-6 py-4 border-b-2 transition-all duration-300 ${
                  activeTab === 'PROFILE' 
                  ? 'border-red-600 text-red-500' 
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Settings size={16} />
                <span className="font-mono text-xs md:text-sm tracking-widest uppercase">Perfil</span>
              </button>
           </div>
         </div>
      </nav>

      {/* Mobile side panel menu */}
      <div
        id="dashboard-mobile-menu"
        className={`md:hidden fixed inset-0 z-[60] ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Overlay */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Fechar menu"
        />

        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-black border-r border-zinc-800 transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">Menu</div>
              <div className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Outcast</div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 border border-zinc-800 bg-black text-zinc-400 hover:text-red-500 hover:border-red-900/50 transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => handleSelectTab('STATUS')}
              className={`w-full flex items-center gap-3 px-4 py-4 border border-transparent text-left transition-colors ${
                activeTab === 'STATUS' ? 'bg-red-950/20 border-red-900/30 text-red-500' : 'text-zinc-300 hover:bg-zinc-900/30 hover:text-zinc-100'
              }`}
            >
              <Activity size={18} className={activeTab === 'STATUS' ? 'text-red-500' : 'text-zinc-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono uppercase tracking-widest">Status</div>
                <div className="text-[10px] text-zinc-600 font-mono">Missões e atributos do personagem</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('RANKING')}
              className={`w-full flex items-center gap-3 px-4 py-4 border border-transparent text-left transition-colors ${
                activeTab === 'RANKING' ? 'bg-red-950/20 border-red-900/30 text-red-500' : 'text-zinc-300 hover:bg-zinc-900/30 hover:text-zinc-100'
              }`}
            >
              <Trophy size={18} className={activeTab === 'RANKING' ? 'text-red-500' : 'text-zinc-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono uppercase tracking-widest">Ranking</div>
                <div className="text-[10px] text-zinc-600 font-mono">Classificação global</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('ORACLE')}
              className={`w-full flex items-center gap-3 px-4 py-4 border border-transparent text-left transition-colors ${
                activeTab === 'ORACLE' ? 'bg-red-950/20 border-red-900/30 text-red-500' : 'text-zinc-300 hover:bg-zinc-900/30 hover:text-zinc-100'
              }`}
            >
              <MessageSquare size={18} className={activeTab === 'ORACLE' ? 'text-red-500' : 'text-zinc-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono uppercase tracking-widest">Oráculo</div>
                <div className="text-[10px] text-zinc-600 font-mono">Chat e diretrizes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('PROFILE')}
              className={`w-full flex items-center gap-3 px-4 py-4 border border-transparent text-left transition-colors ${
                activeTab === 'PROFILE' ? 'bg-red-950/20 border-red-900/30 text-red-500' : 'text-zinc-300 hover:bg-zinc-900/30 hover:text-zinc-100'
              }`}
            >
              <Settings size={18} className={activeTab === 'PROFILE' ? 'text-red-500' : 'text-zinc-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono uppercase tracking-widest">Perfil</div>
                <div className="text-[10px] text-zinc-600 font-mono">Dados do receptáculo</div>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* CONTENT AREA */}
      <main className="min-h-[600px] pt-20 pb-16">
        {activeTab === 'STATUS' && renderStatus()}
        {activeTab === 'RANKING' && renderRanking()}
        {activeTab === 'ORACLE' && renderOracle()}
        {activeTab === 'PROFILE' && renderProfile()}
      </main>

    </div>
  );
};