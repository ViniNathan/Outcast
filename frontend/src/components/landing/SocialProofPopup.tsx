import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, User, Target, Activity } from 'lucide-react';

const EVENTS = [
  { type: 'join', text: 'entrou para o Rank S', icon: Shield },
  { type: 'complete', text: 'completou o Protocolo Diário', icon: Zap },
  { type: 'awaken', text: 'acabou de despertar', icon: Activity },
  { type: 'level', text: 'subiu de nível', icon: Target },
];

const NAMES = ['Agente 402', 'User 881', 'Recruta 007', 'Sombra', 'User 992', 'Agente K', 'User 101', 'Fantasma'];

export const SocialProofPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [event, setEvent] = useState<{ name: string; action: string; icon: any } | null>(null);

  useEffect(() => {
    const showEvent = () => {
      const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      
      setEvent({
        name: randomName,
        action: randomEvent.text,
        icon: randomEvent.icon
      });
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Initial delay
    const initialTimer = setTimeout(showEvent, 2000);

    // Loop every 8-12 seconds
    const loop = setInterval(() => {
      showEvent();
    }, Math.random() * 4000 + 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(loop);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && event && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-24 right-4 z-50 max-w-xs"
        >
          <div className="bg-black border border-zinc-800 border-l-2 border-l-red-600 p-3 shadow-lg shadow-red-900/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-red-950/30 rounded border border-red-900/20">
                {(() => {
                  const Icon = event.icon;
                  return <Icon size={14} className="text-red-500" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    SYSTEM_LOG
                  </span>
                  <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  <span className="text-white font-bold">{event.name}</span>{' '}
                  <span className="text-zinc-400">{event.action}</span>
                </p>
              </div>
            </div>
            
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/5 pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
