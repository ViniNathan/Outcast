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
  const { status } = useSession();
  const searchParams = useSearchParams();

  // Efeito principal que determina o estado inicial baseado em:
  // 1. Se veio do callback do Google (?next=dashboard)
  // 2. Se já visitou antes (localStorage)
  useEffect(() => {
    // Aguarda o NextAuth resolver o status da sessão
    if (status === 'loading') return;

    const next = searchParams.get('next');
    const isFromGoogleCallback = next === 'dashboard';
    const isAuthenticated = status === 'authenticated';

    // Se veio do callback do Google e está autenticado, vai direto para verificar backend
    if (isFromGoogleCallback && isAuthenticated) {
      // Marca como já acessou
      try {
        window.localStorage.setItem('outcast_already_accessed', 'true');
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }

      // Verifica se o User existe no backend
      void (async () => {
        try {
          const meResp = await fetch('/api/dashboard/me', { cache: 'no-store' });
          
          if (!meResp.ok) {
            // User não existe no backend ainda - mostrar onboarding para criar o perfil
            console.log('[PAGE] Usuário ainda não cadastrado no backend - mostrando onboarding');
            setSystemState('ONBOARDING');
          } else {
            // User existe - verificar se precisa completar onboarding
            const data = await meResp.json();
            console.log('[PAGE] Dados do usuário:', data);
            
            // Se não há objetivo (ou era um placeholder antigo), precisa completar onboarding
            if (!data?.objective?.description || data?.objective?.description === 'Pendente') {
              console.log('[PAGE] Objetivo ausente/pendente - mostrando onboarding');
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
      return;
    }

    // Fluxo normal: verifica localStorage para decidir entre BOOT e LANDING
    let visited = null;
    try {
      visited = window.localStorage.getItem('outcast_already_accessed');
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
    
    const isReturning = visited === 'true';
    setHasVisited(isReturning);
    // Em acessos futuros, pulamos o BOOT mas mantemos a landing.
    setSystemState(isReturning ? 'LANDING' : 'BOOT');
  }, [status, searchParams]);

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
    // Após completar onboarding, ir direto para o dashboard
    try {
      window.localStorage.setItem('outcast_already_accessed', 'true');
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
    setHasVisited(true);
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