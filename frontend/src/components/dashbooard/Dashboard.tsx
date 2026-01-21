import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerStat, Mission, ChatMessage, RankEntry } from '@/types/dashboard';
import { 
  User, AlertTriangle, Check, Trophy, MessageSquare, 
  Activity, Settings, Send, Lock, Cpu, Share2, Menu, X, ChevronUp, ChevronDown
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

// --- DATA CONSTANTS ---
const DEFAULT_STATS: PlayerStat[] = [
  { label: 'FORÇA', value: 10, code: 'FOR' },
  { label: 'AGILIDADE', value: 10, code: 'AGI' },
  { label: 'SENTIDOS', value: 10, code: 'SEN' },
  { label: 'VITALIDADE', value: 10, code: 'VIT' },
  { label: 'INTELIG', value: 10, code: 'INT' },
];

// Mensagens de loading enquanto gera missões
const GENERATION_MESSAGES = [
  'INICIANDO PROTOCOLO DE GERAÇÃO...',
  'ANALISANDO PERFIL DO RECEPTÁCULO...',
  'CONSULTANDO O ORÁCULO...',
  'CALCULANDO DIFICULDADE APROPRIADA...',
  'AVALIANDO HISTÓRICO DE DESEMPENHO...',
  'PROCESSANDO DADOS DE ATRIBUTOS...',
  'GERANDO MISSÕES PERSONALIZADAS...',
  'CALIBRANDO RECOMPENSAS E PENALIDADES...',
  'FINALIZANDO PROTOCOLO...',
];

type BackendMeResponse = {
  user: { id: string; authUserId: string; name: string; age: number };
  player: { id: string; xp: number; level: number; class: string; rank: number; attributes?: Record<string, number> | null };
  objective: { id: string; description: string } | null;
  ranking: { position: number } | null;
  settings?: { autoMissionGeneration: boolean; isPremium: boolean } | null;
};

type BackendRankingResponse = {
  ranking: Array<{
    position: number;
    playerId: string;
    name: string;
    level: number;
    xp: number;
    class: string;
  }>;
};

type BackendMissionsResponse = {
  missions: Mission[];
};

function rankLetterForLevel(level: number) {
  // Ajuste quando você tiver uma regra oficial. Por enquanto, mantém a estética.
  if (level >= 20) return 'S';
  if (level >= 15) return 'A';
  if (level >= 10) return 'B';
  if (level >= 5) return 'C';
  if (level >= 2) return 'D';
  return 'E';
}

// --- MAIN COMPONENT ---
export const Dashboard: React.FC = () => {
  const { status, data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE'>('STATUS');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Loading State
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Profile State
  const [playerName, setPlayerName] = useState('OUTCAST');
  const [playerTitle, setPlayerTitle] = useState('Matador de Lobos');
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [playerClass, setPlayerClass] = useState<string>('NENHUMA');
  const [playerRankLetter, setPlayerRankLetter] = useState<string>('E');
  const [playerRankingPosition, setPlayerRankingPosition] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [autoMissionGeneration, setAutoMissionGeneration] = useState<boolean>(false);
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>(DEFAULT_STATS);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isGeneratingMissions, setIsGeneratingMissions] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [isMobileStatusDrawerOpen, setIsMobileStatusDrawerOpen] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'SYSTEM', text: 'O Oráculo está online. Solicite uma diretriz de missão ou análise de combate.', timestamp: new Date() }
  ]);
  const [isOracleThinking, setIsOracleThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Efeito para ciclar mensagens de geração
  useEffect(() => {
    if (!isGeneratingMissions) return;

    let messageIndex = 0;
    setGenerationMessage(GENERATION_MESSAGES[0]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % GENERATION_MESSAGES.length;
      setGenerationMessage(GENERATION_MESSAGES[messageIndex]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isGeneratingMissions]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoadError(null);
        const meResp = await fetch('/api/dashboard/me', { cache: 'no-store' });
        if (!meResp.ok) {
          throw new Error(await meResp.text());
        }
        const me = (await meResp.json()) as BackendMeResponse;
        if (cancelled) return;

        setPlayerName(me.user.name);
        setPlayerTitle(me.objective?.description ?? 'Sem objetivo definido');
        setPlayerLevel(me.player.level);
        setPlayerClass(me.player.class);
        setPlayerRankLetter(rankLetterForLevel(me.player.level));
        setPlayerRankingPosition(me.ranking?.position ?? null);
        setPlayerId(me.player.id);
        setAutoMissionGeneration(me.settings?.autoMissionGeneration ?? false);

        // Processar stats do backend
        const backendAttributes = me.player.attributes as Record<string, number> | null;
        if (backendAttributes) {
          setPlayerStats([
            { label: 'FORÇA', value: backendAttributes.FOR || 10, code: 'FOR' },
            { label: 'AGILIDADE', value: backendAttributes.AGI || 10, code: 'AGI' },
            { label: 'SENTIDOS', value: backendAttributes.SEN || 10, code: 'SEN' },
            { label: 'VITALIDADE', value: backendAttributes.VIT || 10, code: 'VIT' },
            { label: 'INTELIG', value: backendAttributes.INT || 10, code: 'INT' },
          ]);
        } else {
          setPlayerStats(DEFAULT_STATS);
        }

        const rankResp = await fetch('/api/dashboard/ranking?limit=50', { cache: 'no-store' });
        if (!rankResp.ok) {
          throw new Error(await rankResp.text());
        }
        const data = (await rankResp.json()) as BackendRankingResponse;
        if (cancelled) return;

        const myPlayerId = me.player.id;
        setRanking(
          data.ranking.map((r) => ({
            rank: r.position,
            name: r.name,
            level: r.level,
            job: r.class,
            isUser: r.playerId === myPlayerId,
          })),
        );

        // Missões (sempre do backend)
        const missionsResp = await fetch('/api/missions?limit=100', { cache: 'no-store' });
        if (missionsResp.ok) {
          const m = (await missionsResp.json()) as BackendMissionsResponse;
          if (!cancelled) setMissions(m.missions ?? []);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Função para verificar e gerar missões automaticamente
  const checkAndGenerateMissions = useCallback(async () => {
    if (status !== 'authenticated' || !autoMissionGeneration) return;
    
    try {
      setIsGeneratingMissions(true);
      const resp = await fetch('/api/missions/auto-generate', { method: 'POST' });
      if (resp.ok) {
        // Recarregar missões
        const missionsResp = await fetch('/api/missions?limit=100', { cache: 'no-store' });
        if (missionsResp.ok) {
          const m = (await missionsResp.json()) as BackendMissionsResponse;
          setMissions(m.missions ?? []);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar missões automaticamente:', error);
    } finally {
      setIsGeneratingMissions(false);
    }
  }, [status, autoMissionGeneration]);

  // Verifica se precisa gerar missões quando as missões mudam ou após carregamento inicial
  useEffect(() => {
    if (status !== 'authenticated' || !autoMissionGeneration || isLoadingData) return;
    
    const pendingCount = missions.filter((m) => m.status === 'PENDING').length;
    
    // Gera missões se não há pendentes (tanto para usuários novos quanto após completar todas)
    if (pendingCount === 0) {
      const timer = setTimeout(() => {
        void checkAndGenerateMissions();
      }, 1000); // Delay de 1s para evitar múltiplas chamadas
      
      return () => clearTimeout(timer);
    }
  }, [missions, status, autoMissionGeneration, isLoadingData, checkAndGenerateMissions]);

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
  const completeMission = async (mission: Mission) => {
    if (mission.status !== 'PENDING') return;
    
    // Optimistic update - atualiza UI imediatamente
    setMissions(prev => prev.map(m => 
      m.id === mission.id ? { ...m, status: 'COMPLETED' as const, completedAt: new Date().toISOString() } : m
    ));
    
    try {
      const resp = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: mission.id }),
      });
      
      if (!resp.ok) {
        // Reverter em caso de erro
        setMissions(prev => prev.map(m => 
          m.id === mission.id ? { ...m, status: 'PENDING' as const, completedAt: null } : m
        ));
        console.error('Erro ao completar missão');
        return;
      }

      // Atualiza dados completos do servidor em background
      const [missionsResp, meResp] = await Promise.all([
        fetch('/api/missions?limit=100', { cache: 'no-store' }),
        fetch('/api/dashboard/me', { cache: 'no-store' })
      ]);

      if (missionsResp.ok) {
        const m = (await missionsResp.json()) as BackendMissionsResponse;
        setMissions(m.missions ?? []);
      }

      if (meResp.ok) {
        const me = (await meResp.json()) as BackendMeResponse;
        setPlayerLevel(me.player.level);
        setPlayerClass(me.player.class);
        setPlayerRankLetter(rankLetterForLevel(me.player.level));
        setPlayerRankingPosition(me.ranking?.position ?? null);
        
        // Atualizar stats
        const backendAttributes = me.player.attributes as Record<string, number> | null;
        if (backendAttributes) {
          setPlayerStats([
            { label: 'FORÇA', value: backendAttributes.FOR || 10, code: 'FOR' },
            { label: 'AGILIDADE', value: backendAttributes.AGI || 10, code: 'AGI' },
            { label: 'SENTIDOS', value: backendAttributes.SEN || 10, code: 'SEN' },
            { label: 'VITALIDADE', value: backendAttributes.VIT || 10, code: 'VIT' },
            { label: 'INTELIG', value: backendAttributes.INT || 10, code: 'INT' },
          ]);
        }
      }
    } catch (error) {
      // Reverter em caso de erro
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, status: 'PENDING' as const, completedAt: null } : m
      ));
      console.error('Erro ao completar missão:', error);
    }
  };

  const handleSelectTab = (tab: 'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isOracleThinking) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'USER', text: chatInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const messageToSend = chatInput;
    setChatInput('');
    setIsOracleThinking(true);

    try {
      const resp = await fetch('/api/missions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      const text = await resp.text();
      if (!resp.ok) {
        let detail = 'REQUISIÇÃO RECUSADA.';
        try {
          const parsed = JSON.parse(text) as { error?: string; details?: unknown };
          if (typeof parsed?.error === 'string' && parsed.error) detail = parsed.error;
          else if (typeof parsed?.details === 'string' && parsed.details) detail = parsed.details;
        } catch {
          // ignore
        }
        const sysMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'SYSTEM',
          text: detail,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, sysMsg]);
        return;
      }

      let responseMessage = 'MISSÕES GERADAS';
      let missionsCount = 0;
      try {
        const data = JSON.parse(text) as { missions?: Mission[]; message?: string; skipped?: boolean; reason?: string };
        if (data?.missions && data.missions.length > 0) {
          missionsCount = data.missions.length;
          responseMessage = data.message || `${missionsCount} nova(s) missão(ões) criada(s)`;
        } else if (data?.skipped) {
          responseMessage = `Geração ignorada: ${data.reason || 'motivo desconhecido'}`;
        }
      } catch {
        // ignore
      }

      const sysMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'SYSTEM',
        text: responseMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sysMsg]);

      const missionsResp = await fetch('/api/missions?limit=100', { cache: 'no-store' });
      if (missionsResp.ok) {
        const m = (await missionsResp.json()) as BackendMissionsResponse;
        setMissions(m.missions ?? []);
      }
    } catch {
      const sysMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'SYSTEM',
        text: 'FALHA DE COMUNICAÇÃO.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sysMsg]);
    } finally {
      setIsOracleThinking(false);
    }
  };

  const handleToggleAutoMissions = async () => {
    const next = !autoMissionGeneration;
    // Optimistic update
    setAutoMissionGeneration(next);

    try {
      const resp = await fetch('/api/player/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMissionGeneration: next }),
      });
      const text = await resp.text();
      if (!resp.ok) {
        // Revert update
        setAutoMissionGeneration(!next);
        
        let detail = 'FALHA AO ATUALIZAR CONFIGURAÇÃO.';
        try {
          const parsed = JSON.parse(text) as { error?: string; details?: unknown };
          if (typeof parsed?.error === 'string' && parsed.error) detail = parsed.error;
          else if (typeof parsed?.details === 'string' && parsed.details) detail = parsed.details;
        } catch {
          // ignore
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'SYSTEM', text: detail, timestamp: new Date() }]);
        return;
      }
      // Success - state already updated optimistically
    } catch {
      // Revert update
      setAutoMissionGeneration(!next);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'SYSTEM', text: 'FALHA DE COMUNICAÇÃO.', timestamp: new Date() }]);
    }
  };

  // --- COMPONENTS ---
  
  const MissionDetailModal = ({ mission }: { mission: Mission }) => {
    const expiresDate = new Date(mission.expiresAt);
    const now = new Date();
    const timeLeft = expiresDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    const isPending = mission.status === 'PENDING';
    
    return (
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setSelectedMission(null)}
      >
        <div 
          className="bg-black border-2 border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-red-950/20 border-b-2 border-red-900/30 p-6 relative">
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-4 right-4 p-2 border border-zinc-800 bg-black text-zinc-400 hover:text-red-500 hover:border-red-900 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-tight mb-2">
                  {mission.title}
                </h2>
                <div className="flex gap-3 text-xs font-mono">
                  <span className={`px-2 py-1 border ${
                    mission.category === 'DAILY' ? 'border-blue-800 text-blue-500' :
                    mission.category === 'WEEKLY' ? 'border-yellow-800 text-yellow-500' :
                    'border-red-800 text-red-500'
                  }`}>
                    {mission.category}
                  </span>
                  <span className="px-2 py-1 border border-zinc-800 text-zinc-500">
                    RANK {mission.difficulty}
                  </span>
                  <span className={`px-2 py-1 border ${
                    isPending ? 'border-green-900 text-green-500' : 'border-zinc-800 text-zinc-600'
                  }`}>
                    {mission.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Prazo */}
            {isPending && (
              <div className="bg-zinc-950/50 border border-zinc-900 p-3 mt-4">
                <div className="text-xs font-mono text-zinc-600 uppercase mb-1">Prazo</div>
                <div className="text-sm font-mono text-zinc-300">
                  {timeLeft > 0 ? (
                    <>
                      {daysLeft > 0 && <span>{daysLeft}d </span>}
                      {hoursLeft}h restantes
                    </>
                  ) : (
                    <span className="text-red-500">EXPIRADO</span>
                  )}
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  {expiresDate.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Descrição */}
            <div>
              <div className="text-xs font-mono text-zinc-600 uppercase mb-2">Objetivo Detalhado</div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {mission.description}
              </p>
            </div>

            {/* Progresso */}
            <div>
              <div className="text-xs font-mono text-zinc-600 uppercase mb-2">Progresso</div>
              <div className="bg-zinc-950/50 border border-zinc-900 p-4">
                <div className="flex justify-between text-sm font-mono text-zinc-400 mb-2">
                  <span>Meta: {mission.progressTarget} {mission.progressUnit}</span>
                  <span>Atual: {mission.progressCurrent} {mission.progressUnit}</span>
                </div>
                <div className="h-3 w-full bg-zinc-950 border border-zinc-900 relative overflow-hidden">
                  <div 
                    className="h-full bg-red-900 transition-all"
                    style={{ 
                      width: `${mission.progressTarget > 0 ? (mission.progressCurrent / mission.progressTarget) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recompensas */}
            <div>
              <div className="text-xs font-mono text-zinc-600 uppercase mb-2">Recompensas</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-950/20 border border-green-900/30 p-4">
                  <div className="text-xs text-green-700 font-mono mb-1">XP GANHO</div>
                  <div className="text-2xl font-bold text-green-500">+{mission.xpReward}</div>
                </div>
                <div className="bg-red-950/20 border border-red-900/30 p-4">
                  <div className="text-xs text-red-700 font-mono mb-1">XP PENALIDADE</div>
                  <div className="text-2xl font-bold text-red-500">-{mission.xpPenalty}</div>
                </div>
              </div>
              
              {/* Stats Reward */}
              {mission.statRewardCode && mission.statRewardValue && (
                <div className="mt-3 bg-purple-950/20 border border-purple-900/30 p-4">
                  <div className="text-xs text-purple-700 font-mono mb-2">ATRIBUTO BÔNUS</div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-purple-400">{mission.statRewardCode}</span>
                    <span className="text-2xl font-bold text-purple-300">+{mission.statRewardValue}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de completar */}
            {isPending && (
              <button
                onClick={() => {
                  void completeMission(mission);
                  setSelectedMission(null);
                }}
                className="w-full py-4 bg-red-950/30 border-2 border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-all font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Concluir Missão
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- SUB-VIEWS ---

  const renderStatus = () => {
    const pendingCount = missions.filter((m) => m.status === 'PENDING').length;
    const missionLog = (
      <div className="border border-zinc-800 relative overflow-hidden bg-black">
        {/* Overlay de geração de missões */}
        {isGeneratingMissions && (
          <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
            {/* Animação de loading */}
            <div className="relative">
              <div className="w-16 h-16 border-2 border-red-900/30 border-t-red-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu size={24} className="text-red-600 animate-pulse" />
              </div>
            </div>
            
            {/* Mensagem atual */}
            <div className="text-center px-4 max-w-md">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">
                SISTEMA EM OPERAÇÃO
              </div>
              <div className="text-sm font-mono text-red-500 animate-pulse min-h-[1.5rem]">
                {generationMessage}
              </div>
            </div>
            
            {/* Barra de progresso indeterminada */}
            <div className="w-48 h-1 bg-zinc-900 overflow-hidden">
              <div 
                className="h-full bg-red-600 w-1/3"
                style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
              />
            </div>
            
            {/* Texto secundário */}
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
              O Oráculo está deliberando...
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 p-3 sm:p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-red-600 font-bold text-sm tracking-widest flex items-center gap-2 flex-wrap">
              <AlertTriangle size={16} /> LOG DE MISSÕES
            </span>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 border border-zinc-800">
              PLAYER: {playerId ? playerId.slice(0, 6) : '---'}
            </span>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <h3 className="text-xl sm:text-2xl text-zinc-100 mb-2 uppercase tracking-tight font-bold">Missões ativas</h3>
          <p className="text-zinc-500 text-xs font-mono mb-4 border-b border-zinc-900 pb-3 leading-relaxed">
            O sistema emite tarefas mensuráveis. Conclua e receba XP. Falhe e aceite a penalidade.
          </p>

          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border border-zinc-900 bg-zinc-950/30 p-3">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Geração automática
              <span className={autoMissionGeneration ? "text-green-700 ml-2" : "text-red-700 ml-2"}>
                {autoMissionGeneration ? "ON" : "OFF"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleToggleAutoMissions()}
              className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 hover:text-red-500 hover:border-red-900 transition-colors text-xs font-mono uppercase tracking-widest"
            >
              Alternar
            </button>
          </div>

          <div className="space-y-6 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
            {missions.map((mission) => {
              const percent = mission.progressTarget > 0 ? (mission.progressCurrent / mission.progressTarget) * 100 : 0;
              const isCompleted = mission.status === 'COMPLETED';
              const isPending = mission.status === 'PENDING';
              const isFailed = mission.status === 'FAILED' || mission.status === 'EXPIRED';
              return (
                <div 
                  key={mission.id} 
                  onClick={() => setSelectedMission(mission)}
                  className={`group select-none transition-all duration-300 cursor-pointer ${
                    isCompleted ? 'opacity-50 grayscale' : isFailed ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                    <span className="text-sm text-zinc-300 font-bold tracking-wider flex items-center gap-3 group-hover:text-red-500 transition-colors break-words">
                      <div 
                        className={`w-5 h-5 border flex items-center justify-center transition-colors shrink-0 ${
                          isCompleted ? 'bg-zinc-800 border-zinc-600' : 'border-zinc-700 bg-black group-hover:border-red-600'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPending) void completeMission(mission);
                        }}
                      >
                        {isCompleted && <Check size={12} className="text-zinc-400" />}
                      </div>
                      <span className="flex-1 min-w-0 break-words">
                        {mission.title}
                        <span className="ml-3 text-[10px] font-mono text-zinc-600 uppercase">
                          [{mission.category}] [{mission.difficulty}] [{mission.status}]
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-mono text-zinc-500 shrink-0">
                      {mission.progressCurrent}/{mission.progressTarget} {mission.progressUnit}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-zinc-950 border border-zinc-900 relative overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-zinc-600' : 'bg-red-900'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-600">
                    <span>XP: +{mission.xpReward}</span>
                    <span>PENALIDADE: -{mission.xpPenalty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-red-950/5 border-t border-red-900/20 p-4 text-center">
          <span className="text-xs text-red-800 font-mono uppercase animate-pulse font-bold tracking-widest">
            Missões pendentes: {pendingCount}
          </span>
        </div>
      </div>
    );

    const identityCard = (
      <div className="border border-zinc-800 p-5 sm:p-6 space-y-6 bg-black relative overflow-hidden">
          <div className="absolute top-4 right-6 flex flex-col items-center pointer-events-none opacity-90">
            <span className="text-[10px] text-zinc-600 font-mono mb-[-5px]">RANK</span>
            <span className="text-5xl sm:text-6xl font-black text-red-900 drop-shadow-[0_0_10px_rgba(127,29,29,0.5)]">
              {playerRankLetter}
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-zinc-600 font-mono block">NOME</span>
            <span className="text-xl sm:text-2xl text-zinc-200 font-bold tracking-wide break-words leading-tight">{playerName}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-600 font-mono block">NÍVEL</span>
              <span className="text-xl lg:text-2xl text-zinc-300 font-mono">{playerLevel}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-600 font-mono block">CLASSE</span>
              <span className="text-xl lg:text-2xl text-zinc-500 font-mono">{playerClass}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-600 font-mono block">POSIÇÃO</span>
              <span className="text-xl lg:text-2xl text-zinc-300 font-mono">{playerRankingPosition ?? '--'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-600 font-mono block">MISSÕES</span>
              <span className="text-xl lg:text-2xl text-zinc-500 font-mono">
                {missions.filter((m) => m.status === 'PENDING').length}
              </span>
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
          {playerStats.map((stat) => (
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
      </div>
    );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-6xl mx-auto">
        {/* MOBILE LAYOUT: Log de missões + Drawer inferior com status */}
        <div className="lg:hidden pb-16">
          {/* Apenas o log de missões */}
          {missionLog}
          
          {/* Drawer inferior com status */}
          <div 
            className={`fixed left-0 right-0 bottom-0 z-[55] transition-transform duration-300 ease-out ${
              isMobileStatusDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-56px)]'
            }`}
          >
            {/* Handle do drawer */}
            <button
              type="button"
              onClick={() => setIsMobileStatusDrawerOpen(!isMobileStatusDrawerOpen)}
              className="w-full bg-black border-t border-x border-zinc-800 rounded-t-xl py-3 px-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-red-600" />
                  <span className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{playerName}</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">LV.{playerLevel}</span>
                <span className="text-lg font-black text-red-900">{playerRankLetter}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  {isMobileStatusDrawerOpen ? 'Fechar' : 'Ver Status'}
                </span>
                {isMobileStatusDrawerOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
            </button>
            
            {/* Conteúdo do drawer */}
            <div className="bg-black border-x border-zinc-800 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Card de identidade compacto para mobile */}
                <div className="border border-zinc-800 p-4 space-y-4 bg-zinc-950/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-[10px] text-zinc-600 font-mono block">NOME</span>
                      <span className="text-lg text-zinc-200 font-bold tracking-wide break-words leading-tight">{playerName}</span>
                    </div>
                    <div className="flex flex-col items-center ml-4">
                      <span className="text-[10px] text-zinc-600 font-mono">RANK</span>
                      <span className="text-4xl font-black text-red-900 drop-shadow-[0_0_10px_rgba(127,29,29,0.5)]">
                        {playerRankLetter}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-600 font-mono block">NÍVEL</span>
                      <span className="text-lg text-zinc-300 font-mono">{playerLevel}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-600 font-mono block">CLASSE</span>
                      <span className="text-lg text-zinc-500 font-mono truncate block">{playerClass}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-600 font-mono block">POSIÇÃO</span>
                      <span className="text-lg text-zinc-300 font-mono">{playerRankingPosition ?? '--'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-600 font-mono block">MISSÕES</span>
                      <span className="text-lg text-zinc-500 font-mono">
                        {missions.filter((m) => m.status === 'PENDING').length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-zinc-900 pt-3">
                    <span className="text-[10px] text-zinc-600 font-mono block">TÍTULO</span>
                    <span className="text-xs text-zinc-500 uppercase break-words">{playerTitle}</span>
                  </div>
                </div>

                {/* Stats panel */}
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-2">Atributos</div>
                  <div className="grid grid-cols-5 gap-2">
                    {playerStats.map((stat) => (
                      <div key={stat.code} className="border border-zinc-900 p-2 bg-zinc-950/30 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-zinc-600 font-mono mb-1">
                          {stat.code}
                        </div>
                        <div className="text-xl font-bold text-zinc-300 font-mono">
                          {String(stat.value).padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          </div>

          <div className="lg:col-span-8 space-y-6 flex flex-col">
            {missionLog}
            {statsPanel}
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
                  <span className="text-xl font-mono text-zinc-300">
                    {String(playerLevel).padStart(2, '0')}
                  </span>
               </div>
               <div>
                  <span className="block text-[8px] font-mono text-zinc-600 uppercase">Classe</span>
                  <span className="text-xl font-mono text-zinc-500">{playerClass}</span>
               </div>
               <div>
                  <span className="block text-[8px] font-mono text-zinc-600 uppercase">Rank</span>
                  <span className="text-xl font-mono text-red-600">{playerRankLetter}</span>
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
        
        {ranking.map((entry) => (
          <div 
            key={entry.rank} 
            className={`grid grid-cols-12 gap-4 p-4 border-b border-zinc-900 items-center ${
              entry.isUser ? 'bg-red-950/10 border-red-900/30' : 'hover:bg-zinc-900/20'
            }`}
          >
            <div className="col-span-2 font-bold font-mono text-lg">
              {entry.rank === 1 ? <span className="text-yellow-500">#1</span> : 
               entry.isUser ? <span className="text-red-600">#{entry.rank}</span> : 
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
        {/* Mensagem de loading enquanto o Oráculo processa */}
        {isOracleThinking && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 border bg-black border-red-900/30 text-red-500">
               <div className="flex items-center gap-2 mb-2 border-b border-dashed border-zinc-700/50 pb-1">
                 <span className="text-[10px] font-mono uppercase opacity-70">ORÁCULO</span>
                 <span className="text-[10px] font-mono opacity-50 animate-pulse">processando...</span>
               </div>
               <div className="flex items-center gap-1">
                 <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isOracleThinking && handleSendMessage()}
            placeholder={isOracleThinking ? "Oráculo processando..." : "Solicite uma análise ou diretriz..."}
            disabled={isOracleThinking}
            className="flex-1 bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-sm focus:border-red-900 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            onClick={handleSendMessage}
            disabled={isOracleThinking}
            className="bg-zinc-900 border border-zinc-800 p-3 text-zinc-400 hover:text-red-500 hover:border-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-zinc-400 disabled:hover:border-zinc-800"
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
          {loadError ? (
            <div className="border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-400 font-mono">
              Falha ao carregar dados do backend.
            </div>
          ) : null}

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
            <label className="text-xs font-mono text-zinc-500 uppercase">Objetivo Principal</label>
            <textarea 
              value={playerTitle}
              onChange={(e) => {
                const value = e.target.value;
                const objectives = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                if (objectives.length <= 3) {
                  setPlayerTitle(value);
                }
              }}
              placeholder="Ex: Emagrecer, Estudar programação, Ler mais livros"
              rows={3}
              className="w-full bg-zinc-900/30 border border-zinc-700 p-3 text-zinc-300 focus:border-red-600 focus:bg-zinc-900/50 outline-none transition-all font-mono text-sm resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-mono text-zinc-600">
                Defina até 3 objetivos separados por vírgula. Eles guiam a geração de missões.
              </p>
              <span className={`text-[10px] font-mono ${
                playerTitle.split(',').filter(s => s.trim().length > 0).length >= 3 
                  ? 'text-red-500' 
                  : 'text-zinc-600'
              }`}>
                {playerTitle.split(',').filter(s => s.trim().length > 0).length}/3
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
             <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-xs font-mono text-zinc-600 uppercase flex items-center gap-2">
                  <Lock size={10} /> Classe
                </label>
                <div className="w-full border-b border-zinc-800 p-3 text-zinc-700 font-mono uppercase">
                  {playerClass}
                </div>
             </div>
             <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-xs font-mono text-zinc-600 uppercase flex items-center gap-2">
                  <Lock size={10} /> Rank
                </label>
                <div className="w-full border-b border-zinc-800 p-3 text-red-900/50 font-bold font-mono uppercase">
                  {playerRankLetter}-Rank
                </div>
             </div>
          </div>
          
          <div className="pt-8">
            <button
              type="button"
              onClick={async () => {
                if (status !== 'authenticated' || !session?.user?.id) return;
                setIsSavingProfile(true);
                try {
                  const resp = await fetch('/api/dashboard/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      name: playerName,
                      objective: playerTitle,
                      playerId: playerId,
                    }),
                  });
                  if (!resp.ok) {
                    console.error('Falha ao salvar perfil:', await resp.text());
                    return;
                  }

                  // Recarrega "me" para refletir o backend
                  const meResp = await fetch('/api/dashboard/me', { cache: 'no-store' });
                  if (meResp.ok) {
                    const me = (await meResp.json()) as BackendMeResponse;
                    setPlayerName(me.user.name);
                    setPlayerTitle(me.objective?.description ?? 'Sem objetivo definido');
                    setPlayerLevel(me.player.level);
                    setPlayerClass(me.player.class);
                    setPlayerRankLetter(rankLetterForLevel(me.player.level));
                    setPlayerRankingPosition(me.ranking?.position ?? null);
                  }
                } finally {
                  setIsSavingProfile(false);
                }
              }}
              disabled={isSavingProfile}
              className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600 hover:bg-red-950/20 transition-all font-bold tracking-widest uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full mt-4 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600 hover:bg-red-950/20 transition-all font-bold tracking-widest uppercase text-sm"
            >
              Logout
            </button>
          </div>
       </div>
    </div>
  );

  if (status === 'loading' || isLoadingData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="text-red-600 font-mono tracking-[0.5em] text-xl animate-pulse font-bold">
          INITIALIZING SYSTEM...
        </div>
        <div className="w-64 h-1 bg-zinc-900 overflow-hidden">
          <div className="h-full bg-red-600 animate-pulse w-full"></div>
        </div>
        <div className="text-zinc-600 font-mono text-xs uppercase">
          Carregando dados do receptáculo
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] max-w-7xl mx-auto px-4 md:px-6 flex flex-col overflow-hidden">
      
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
      <main className="flex-1 pt-16 md:pt-14 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="py-4 md:py-8 flex-1 flex flex-col justify-center">
          {activeTab === 'STATUS' && renderStatus()}
          {activeTab === 'RANKING' && renderRanking()}
          {activeTab === 'ORACLE' && renderOracle()}
          {activeTab === 'PROFILE' && renderProfile()}
        </div>
      </main>

      {/* MISSION DETAIL MODAL */}
      {selectedMission && <MissionDetailModal mission={selectedMission} />}

    </div>
  );
};