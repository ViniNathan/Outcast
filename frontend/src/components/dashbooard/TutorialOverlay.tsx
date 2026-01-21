import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

export interface TutorialStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiredTab?: 'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE';
  action?: () => void;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onChangeTab?: (tab: 'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE') => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  currentStep,
  isActive,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onChangeTab,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const updateTargetPosition = useCallback(() => {
    if (!step) return;

    // Primeiro tenta por ID, depois por classe (para elementos que existem em mobile e desktop)
    let element = document.getElementById(step.targetId);
    
    // Se não encontrou por ID, tenta por classe e pega o elemento visível
    if (!element && step.targetId.startsWith('tutorial-')) {
      const elements = document.querySelectorAll(`.${step.targetId}`);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Verifica se o elemento está visível (tem dimensões e está na viewport)
        if (rect.width > 0 && rect.height > 0) {
          element = el as HTMLElement;
          break;
        }
      }
    }

    if (element) {
      // Scroll suave para garantir que o elemento está visível
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Se o elemento não está totalmente visível, faz scroll
      if (rect.top < 80 || rect.bottom > viewportHeight - 80) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Aguarda o scroll terminar antes de atualizar a posição
        setTimeout(() => {
          const newRect = element.getBoundingClientRect();
          setTargetRect({
            top: newRect.top,
            left: newRect.left,
            width: newRect.width,
            height: newRect.height,
            bottom: newRect.bottom,
            right: newRect.right,
          });
        }, 300);
        return;
      }

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      // Se não encontrar o elemento, centraliza
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isActive || !step) return;

    // Se o passo requer uma tab específica, muda para ela
    if (step.requiredTab && onChangeTab) {
      onChangeTab(step.requiredTab);
    }

    // Executa ação do passo se houver
    if (step.action) {
      step.action();
    }

    // Delay para animação
    setIsAnimating(true);
    const animTimer = setTimeout(() => setIsAnimating(false), 300);

    // Aguarda um pouco para o DOM atualizar
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 100);

    // Atualiza posição no scroll/resize
    window.addEventListener('scroll', updateTargetPosition, true);
    window.addEventListener('resize', updateTargetPosition);

    return () => {
      clearTimeout(timer);
      clearTimeout(animTimer);
      window.removeEventListener('scroll', updateTargetPosition, true);
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [isActive, step, currentStep, updateTargetPosition, onChangeTab]);

  if (!isActive || !step) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    if (!targetRect) {
      // Centralizado
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calcula largura real do tooltip (responsivo)
    const tooltipWidth = Math.min(320, viewportWidth - 32);
    const tooltipHeight = 280; // Estimativa mais realista

    // Calcula espaços disponíveis
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = viewportWidth - targetRect.right;

    // Determina a melhor posição baseado no espaço disponível
    let finalPosition = step.position;

    // Auto-adjust: sempre verifica se cabe
    if (finalPosition === 'top' && spaceAbove < tooltipHeight + padding) {
      finalPosition = spaceBelow >= tooltipHeight + padding ? 'bottom' : 'center';
    } else if (finalPosition === 'bottom' && spaceBelow < tooltipHeight + padding) {
      finalPosition = spaceAbove >= tooltipHeight + padding ? 'top' : 'center';
    } else if (finalPosition === 'left' && spaceLeft < tooltipWidth + padding) {
      finalPosition = spaceRight >= tooltipWidth + padding ? 'right' : 
                      spaceBelow >= tooltipHeight + padding ? 'bottom' : 'top';
    } else if (finalPosition === 'right' && spaceRight < tooltipWidth + padding) {
      finalPosition = spaceLeft >= tooltipWidth + padding ? 'left' : 
                      spaceBelow >= tooltipHeight + padding ? 'bottom' : 'top';
    }

    // Calcula posição horizontal centralizada com o elemento
    const centeredLeft = Math.max(
      padding,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        viewportWidth - tooltipWidth - padding
      )
    );

    // Calcula posição vertical centralizada com o elemento
    const centeredTop = Math.max(
      padding,
      Math.min(
        targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        viewportHeight - tooltipHeight - padding
      )
    );

    switch (finalPosition) {
      case 'top':
        return {
          position: 'fixed',
          top: Math.max(padding, targetRect.top - tooltipHeight - padding),
          left: centeredLeft,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: Math.min(targetRect.bottom + padding, viewportHeight - tooltipHeight - padding),
          left: centeredLeft,
        };
      case 'left':
        return {
          position: 'fixed',
          top: centeredTop,
          left: Math.max(padding, targetRect.left - tooltipWidth - padding),
        };
      case 'right':
        return {
          position: 'fixed',
          top: centeredTop,
          left: Math.min(targetRect.right + padding, viewportWidth - tooltipWidth - padding),
        };
      default:
        // Centralizado na tela
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const getSpotlightStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        clipPath: 'none',
      };
    }

    const padding = 8;
    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;

    // Cria um "buraco" no overlay usando polygon
    return {
      clipPath: `polygon(
        0% 0%,
        0% 100%,
        ${x}px 100%,
        ${x}px ${y}px,
        ${x + w}px ${y}px,
        ${x + w}px ${y + h}px,
        ${x}px ${y + h}px,
        ${x}px 100%,
        100% 100%,
        100% 0%
      )`,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Overlay escuro com spotlight */}
      <div
        className="absolute inset-0 bg-black/80 transition-all duration-300"
        style={getSpotlightStyle()}
        onClick={onSkip}
      />

      {/* Borda de destaque ao redor do elemento */}
      {targetRect && (
        <div
          className={`absolute border-2 border-red-600 pointer-events-none transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.3)',
          }}
        >
          {/* Cantos decorativos */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-500" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-500" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-500" />
        </div>
      )}

      {/* Tooltip card */}
      <div
        className={`w-[calc(100vw-32px)] max-w-[320px] bg-black border-2 border-zinc-800 shadow-2xl pointer-events-auto transition-all duration-300 ${
          isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="bg-red-950/30 border-b border-red-900/30 p-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-red-500" />
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Tutorial {currentStep + 1}/{steps.length}
              </div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
            aria-label="Pular tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-zinc-400 leading-relaxed font-mono">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="px-4 pb-2 flex justify-center gap-1.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep
                  ? 'bg-red-600'
                  : idx < currentStep
                  ? 'bg-red-900'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="p-4 pt-2 flex gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              className="flex-1 py-3 border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}

          {isLastStep ? (
            <button
              onClick={onComplete}
              className="flex-1 py-3 bg-red-950/50 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Concluir
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 py-3 bg-red-950/50 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Skip link */}
        <div className="px-4 pb-4 text-center">
          <button
            onClick={onSkip}
            className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest"
          >
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook para gerenciar o tutorial
export const useTutorial = (
  onChangeTab?: (tab: 'STATUS' | 'RANKING' | 'ORACLE' | 'PROFILE') => void
) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Verifica se o usuário já viu o tutorial
  useEffect(() => {
    const seen = localStorage.getItem('outcast_tutorial_completed');
    setHasSeenTutorial(seen === 'true');

    // Detecta mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define steps dinamicamente baseado em mobile/desktop
  const steps: TutorialStep[] = [
    // Passo 1: Boas-vindas (centralizado)
    {
      id: 'welcome',
      targetId: 'tutorial-welcome',
      title: 'Bem-vindo ao Sistema',
      description: 'Este tutorial vai guiá-lo pelos principais recursos do dashboard. O Sistema foi projetado para transformar seus objetivos em missões mensuráveis.',
      position: 'center',
      requiredTab: 'STATUS',
    },
    // Passo 2: Navegação
    {
      id: 'navigation',
      targetId: 'tutorial-nav',
      title: 'Navegação',
      description: isMobile 
        ? 'Toque no botão de Menu para acessar as seções: Status, Ranking, Oráculo e Perfil.'
        : 'Use o menu para acessar diferentes seções: Status (suas missões), Ranking (classificação global), Oráculo (chat de comandos) e Perfil (seus dados).',
      position: 'bottom',
      requiredTab: 'STATUS',
    },
    // Passo 3: Log de Missões
    {
      id: 'missions',
      targetId: isMobile ? 'tutorial-missions-mobile' : 'tutorial-missions-desktop',
      title: 'Log de Missões',
      description: 'Aqui você verá suas missões ativas. Cada missão tem prazo, recompensa de XP e penalidade por falha. Toque em uma missão para ver detalhes.',
      position: 'bottom', // Sempre bottom pois o elemento está no topo da página
      requiredTab: 'STATUS',
    },
    // Passo 4: Geração Automática (usa classe para encontrar o elemento visível)
    {
      id: 'auto-generate',
      targetId: 'tutorial-auto-generate', // Busca por classe
      title: 'Geração Automática',
      description: 'Ative esta opção para que o Sistema gere missões automaticamente baseadas nos seus objetivos.',
      position: 'bottom',
      requiredTab: 'STATUS',
    },
    // Passo 5: Card de Identidade (mobile usa drawer, desktop usa card lateral)
    {
      id: 'identity',
      targetId: isMobile ? 'tutorial-status-drawer-handle' : 'tutorial-identity',
      title: isMobile ? 'Drawer de Status' : 'Seu Status',
      description: isMobile 
        ? 'Deslize para cima nesta barra para ver seu status completo: nome, nível, classe e atributos.'
        : 'Seu perfil de caçador: nome, nível, classe e rank. Seu rank evolui conforme você completa missões.',
      position: isMobile ? 'top' : 'bottom', // bottom em desktop pois o card está no topo
      requiredTab: 'STATUS',
    },
    // Passo 6: Atributos (apenas em desktop, mobile já viu no drawer)
    ...(!isMobile ? [{
      id: 'stats',
      targetId: 'tutorial-stats',
      title: 'Atributos',
      description: 'Seus atributos (FOR, AGI, SEN, VIT, INT) evoluem ao completar missões específicas. Cada missão pode recompensar pontos de atributo.',
      position: 'bottom' as const, // bottom pois está abaixo do log
      requiredTab: 'STATUS' as const,
    }] : []),
    // Passo 7: Ranking
    {
      id: 'ranking',
      targetId: 'tutorial-ranking-content',
      title: 'Classificação Global',
      description: 'Veja sua posição entre todos os caçadores. Suba de rank completando missões e ganhando XP.',
      position: 'bottom', // bottom pois conteúdo está no topo
      requiredTab: 'RANKING',
    },
    // Passo 8: Oráculo
    {
      id: 'oracle',
      targetId: 'tutorial-oracle-content',
      title: 'O Oráculo',
      description: 'Converse com o Oráculo para solicitar missões personalizadas. Descreva o que deseja alcançar.',
      position: 'bottom', // bottom pois conteúdo está no topo
      requiredTab: 'ORACLE',
    },
    // Passo 9: Perfil
    {
      id: 'profile',
      targetId: 'tutorial-profile-content',
      title: 'Seu Perfil',
      description: 'Edite seu nome e defina até 3 objetivos principais. Esses objetivos guiam a geração de missões.',
      position: 'bottom', // bottom pois conteúdo está no topo
      requiredTab: 'PROFILE',
    },
    // Passo 10: Conclusão
    {
      id: 'conclusion',
      targetId: 'tutorial-conclusion',
      title: 'Pronto para Evoluir',
      description: 'Tutorial completo! Defina seus objetivos no Perfil e comece a completar missões. O Sistema está observando.',
      position: 'center',
      requiredTab: 'STATUS',
    },
  ];

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    // Troca para STATUS ao iniciar
    if (onChangeTab) {
      onChangeTab('STATUS');
    }
  }, [onChangeTab]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('outcast_tutorial_completed', 'true');
    setHasSeenTutorial(true);
    // Volta para STATUS
    if (onChangeTab) {
      onChangeTab('STATUS');
    }
  }, [onChangeTab]);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('outcast_tutorial_completed', 'true');
    setHasSeenTutorial(true);
    // Volta para STATUS
    if (onChangeTab) {
      onChangeTab('STATUS');
    }
  }, [onChangeTab]);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem('outcast_tutorial_completed');
    setHasSeenTutorial(false);
  }, []);

  return {
    isActive,
    currentStep,
    steps,
    hasSeenTutorial,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
  };
};
