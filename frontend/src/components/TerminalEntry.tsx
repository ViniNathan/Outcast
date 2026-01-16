import React, { useState, useEffect } from 'react';
import { BOOT_SEQUENCE } from '@/utils/constants';

interface TerminalEntryProps {
  onComplete: () => void;
}

export const TerminalEntry: React.FC<TerminalEntryProps> = ({ onComplete }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (currentLineIndex < BOOT_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
      }, 800 + Math.random() * 500); // Random delay for realism
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentLineIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full px-6">
      <div className="max-w-md w-full font-mono text-sm md:text-base leading-relaxed tracking-wider">
        {BOOT_SEQUENCE.slice(0, currentLineIndex).map((line, index) => (
          <div key={index} className={`mb-2 ${line.includes("UNKNOWN") || line.includes("UNRANKED") ? "text-red-700" : "text-zinc-500"}`}>
            <span className="mr-2 opacity-50">{`>`}</span>
            {line}
          </div>
        ))}
        
        {showPrompt && (
          <div className="mt-12 flex flex-col items-center animate-in fade-in duration-1000">
            <p className="text-zinc-300 mb-8 tracking-[0.2em] text-center uppercase">
              Do you accept the evaluation?
            </p>
            
            <button
              onClick={onComplete}
              className="group relative px-12 py-3 bg-transparent border border-red-900/50 hover:border-red-600 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-red-900/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              <span className="relative z-10 text-red-600 font-bold tracking-widest text-lg group-hover:text-red-500">
                ACCEPT
              </span>
              
              {/* Corner decors */}
              <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};