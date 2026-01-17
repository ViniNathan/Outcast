'use client';

import React, { useEffect, useState } from 'react';
import { TerminalEntry } from '@/components/TerminalEntry';
import { SystemInterface } from '@/components/SystemInterface';
import { Dashboard } from '@/components/dashbooard/Dashboard';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'INITIALIZING' | 'BOOT' | 'LANDING' | 'DASHBOARD'>('INITIALIZING');
  const [hasVisited, setHasVisited] = useState<boolean>(false);
  const { status, data: session } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verifica se o usuário já acessou o sistema anteriormente
    let visited = null;
    try {
      visited = window.localStorage.getItem('outcast_already_accessed');
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
    
    // Deferimos a atualização para evitar o erro de cascading render
    // e garantir que o estado inicial 'INITIALIZING' seja processado corretamente
    const timeout = setTimeout(() => {
      const isReturning = visited === 'true';
      setHasVisited(isReturning);
      // Em acessos futuros, pulamos o BOOT mas mantemos a landing.
      setSystemState(isReturning ? 'LANDING' : 'BOOT');
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  // Se o usuário acabou de voltar do NextAuth com intenção explícita de entrar no dashboard,
  // só então redirecionamos automaticamente (ex.: pós-login/registro).
  useEffect(() => {
    const next = searchParams.get('next');
    if (next !== 'dashboard') return;
    if (status !== 'authenticated') return;

    // Deferimos para evitar o lint `react-hooks/set-state-in-effect`
    const timeout = setTimeout(() => {
      // Marca como já acessou (pula BOOT nas próximas visitas)
      try {
        window.localStorage.setItem('outcast_already_accessed', 'true');
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }

      // Se existir um perfil pendente criado no registro antes do login, "promove" após autenticar
      try {
        const pending = window.localStorage.getItem('outcast_profile_pending');
        if (pending && session?.user?.id) {
          const key = `outcast_profile_v1:${session.user.id}`;
          if (!window.localStorage.getItem(key)) {
            window.localStorage.setItem(key, pending);
          }
          window.localStorage.removeItem('outcast_profile_pending');
        }
      } catch (e) {
        console.error('Erro ao sincronizar perfil pendente:', e);
      }

      setSystemState('DASHBOARD');
    }, 0);

    return () => clearTimeout(timeout);
  }, [searchParams, status, session?.user?.id]);

  const handleBootComplete = () => {
    setSystemState('LANDING');
  };

  const handleAwaken = () => {
    try {
      // Salva que o usuário já passou pelo processo inicial
      window.localStorage.setItem('outcast_already_accessed', 'true');
      setHasVisited(true);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
    setSystemState('DASHBOARD');
  };

  // Evita flash do conteúdo inicial enquanto verifica o localStorage
  if (systemState === 'INITIALIZING') {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 font-mono selection:bg-red-900 selection:text-white overflow-hidden">
      <main className="relative z-10 w-full min-h-screen flex flex-col">
        {systemState === 'BOOT' && (
          <TerminalEntry onComplete={handleBootComplete} />
        )}
        
        {systemState === 'LANDING' && (
          <SystemInterface onAwaken={handleAwaken} isFirstAccess={!hasVisited} />
        )}

        {systemState === 'DASHBOARD' && (
          <Dashboard />
        )}
      </main>

      {/* Decorative corners */}
      <div className="fixed bottom-0 left-0 p-4 z-50 pointer-events-none text-[10px] text-zinc-800">
        ID: {systemState === 'DASHBOARD' ? 'JOGADOR_01' : 'DESCONHECIDO'}
      </div>
    </div>
  );
};

export default App;