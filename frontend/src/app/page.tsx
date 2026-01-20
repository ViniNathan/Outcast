'use client';

import React, { useEffect, useState } from 'react';
import { TerminalEntry } from '@/components/TerminalEntry';
import { SystemInterface } from '@/components/SystemInterface';
import { Dashboard } from '@/components/dashbooard/Dashboard';
import { OnboardingScreen } from '@/components/auth/OnboardingScreen';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'INITIALIZING' | 'BOOT' | 'LANDING' | 'ONBOARDING' | 'DASHBOARD'>('INITIALIZING');
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
  // verificamos se o User existe no backend.
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

      // Verifica se o User existe e se precisa completar o onboarding
      void (async () => {
        try {
          const meResp = await fetch('/api/dashboard/me', { cache: 'no-store' });
          
          if (!meResp.ok) {
            // User não existe no backend (erro inesperado) - mostrar onboarding
            console.error('[PAGE] Usuário não encontrado no backend');
            setSystemState('ONBOARDING');
          } else {
            // User existe - verificar se precisa completar onboarding
            const data = await meResp.json();
            console.log('[PAGE] Dados do usuário:', data);
            
            // Se description é "Pendente", precisa completar onboarding
            if (data?.objective?.description === 'Pendente') {
              console.log('[PAGE] Objetivo pendente - mostrando onboarding');
              setSystemState('ONBOARDING');
            } else {
              console.log('[PAGE] Perfil completo - indo para dashboard');
              setSystemState('DASHBOARD');
            }
          }
        } catch (e) {
          console.error('[PAGE] Erro ao verificar usuário:', e);
          // Em caso de erro, mostrar onboarding para garantir
          setSystemState('ONBOARDING');
        }
      })();
    }, 0);

    return () => clearTimeout(timeout);
  }, [searchParams, status]);

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

  const handleOnboardingComplete = () => {
    // Após completar onboarding, marcar como primeiro acesso para mostrar tutorial
    setHasVisited(false);
    setSystemState('LANDING');
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

        {systemState === 'ONBOARDING' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
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