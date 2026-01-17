import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { BOOT_SEQUENCE } from '@/utils/constants';
import fallenArchitect from '@/assets/fallen_architect.png';

interface TerminalEntryProps {
  onComplete: () => void;
}

export const TerminalEntry: React.FC<TerminalEntryProps> = ({ onComplete }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSplashMounted, setIsSplashMounted] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(false);

  useEffect(() => {
    if (currentLineIndex < BOOT_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
      }, 900); // Fixed timing for impact
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        // Mount splash (bottom-aligned) and fade it in
        setIsSplashMounted(true);
      }, 0);

      const timeout2 = setTimeout(() => {
        // Allow a tick so CSS transition can animate from 0 -> 100
        setIsSplashVisible(true);
      }, 30);

      // Hold a bit, then fade out
      const timeout3 = setTimeout(() => {
        setIsSplashVisible(false);
      }, 4000); // Image stays visible for 4 seconds before fade-out

      // After fade-out completes, unmount splash and show prompt
      const timeout4 = setTimeout(() => {
        setIsSplashMounted(false);
        setShowPrompt(true);
      }, 9000); // Wait for fade-out (5s) + buffer

      return () => {
        clearTimeout(timeout);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
      };
    }
  }, [currentLineIndex]);

  // Helper to determine text color based on content content
  const getLineColor = (text: string) => {
    if (text.includes("NULO") || text.includes("LIXO") || text.includes("FRÁGIL") || text.includes("QUEBRADA")) {
      return "text-red-600 font-bold drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]";
    }
    if (text.includes("SISTEMA")) return "text-zinc-100";
    return "text-zinc-500";
  };

  const currentLine = BOOT_SEQUENCE[currentLineIndex];

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full px-6 bg-black relative z-50">
      
      {/* Centralized Output Area */}
      {!showPrompt && currentLineIndex < BOOT_SEQUENCE.length && (
        <div className="flex items-center justify-center h-32 w-full animate-in fade-in zoom-in duration-300 key={currentLineIndex}">
          <h1 className={`text-2xl md:text-4xl font-mono tracking-widest uppercase text-center ${getLineColor(currentLine)}`}>
            {currentLine}
          </h1>
        </div>
      )}

      {/* Boot splash image (after sequence, before prompt) */}
      {!showPrompt && isSplashMounted && currentLineIndex >= BOOT_SEQUENCE.length && (
        <div
          className={`fixed inset-x-0 bottom-0 z-50 pointer-events-none transition-opacity duration-5000 ${
            isSplashVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative w-full h-[42vh] md:h-[80vh]">
            <Image
              src={fallenArchitect}
              alt="Fallen Architect"
              priority
              fill
              className="object-contain object-bottom"
            />
          </div>
        </div>
      )}
      
      {showPrompt && (
        <div className="mt-0 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-red-600 text-6xl mb-6 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <p className="text-zinc-300 mb-12 tracking-[0.2em] text-center uppercase text-sm md:text-base max-w-md leading-relaxed">
            Sua insignificância foi confirmada.<br/>
            Deseja aceitar a reavaliação?
          </p>
          
          <button
            onClick={onComplete}
            className="group relative px-16 py-4 bg-transparent border border-red-900/50 hover:border-red-600 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-red-900/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            <span className="relative z-10 text-red-600 font-bold tracking-[0.25em] text-xl group-hover:text-red-500 cursor-pointer">
              ACEITAR
            </span>
            
            {/* Corner decors */}
            <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}
    </div>
  );
};