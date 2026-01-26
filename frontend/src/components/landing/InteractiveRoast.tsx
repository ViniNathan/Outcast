'use client';

import React, { useState } from 'react';
import { Send, Terminal, AlertTriangle, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InteractiveRoast = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weakness: input }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'System Failure');

      setAnalysis(data.analysis);
    } catch (err) {
      setError('ERRO DE CONEXÃO COM O NÚCLEO. TENTE NOVAMENTE.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-1 relative group">
      {/* Border Gradient / Glitch Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-transparent to-red-900/40 opacity-50 group-hover:opacity-100 transition-opacity blur-sm" />
      
      <div className="relative bg-black border border-red-900/50 p-6 md:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-red-900/20 pb-4">
          <Cpu className="text-red-500 animate-pulse" size={20} />
          <h3 className="font-mono text-red-500 tracking-[0.2em] text-sm uppercase">
            Módulo de Diagnóstico Direto
          </h3>
          <div className="ml-auto flex gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] text-red-400 font-mono">ONLINE</span>
          </div>
        </div>

        {/* Output Display */}
        <div className="min-h-[120px] mb-6 font-mono text-sm md:text-base leading-relaxed">
          <AnimatePresence mode="wait">
            {!analysis && !loading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-zinc-500"
              >
                <span className="text-red-500 mr-2">{'>'}</span>
                O sistema aguarda seus dados. Digite sua maior fraqueza, desculpa ou hábito ruim.
                <br />
                <span className="text-zinc-700 text-xs mt-2 block">Ex: "Eu procrastino demais", "Não consigo acordar cedo", "Tenho medo de falhar".</span>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-400 animate-pulse"
              >
                {'>'} ANALISANDO PADRÕES DE FALHA...
                <br />
                {'>'} ACESSANDO BANCO DE DADOS PSICOLÓGICO...
                <br />
                {'>'} JULGANDO...
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 bg-red-950/20 p-4 border border-red-900/50"
              >
                <AlertTriangle size={16} className="inline mr-2" />
                {error}
              </motion.div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-zinc-100"
              >
                <span className="text-red-500 font-bold block mb-2">{'>'} RESULTADO DA ANÁLISE:</span>
                <p className="typing-effect">{analysis}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative mt-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-red-500 font-mono text-lg">{'>'}</span>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DIGITE SUA FRAQUEZA..."
            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 font-mono text-sm pl-8 pr-12 py-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all placeholder:text-zinc-700 uppercase tracking-wider"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute inset-y-0 right-0 px-4 text-zinc-500 hover:text-red-500 disabled:opacity-50 disabled:hover:text-zinc-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        
        <div className="mt-2 text-[10px] text-zinc-600 font-mono text-right uppercase">
           Powered by Gemini Neural Network
        </div>
      </div>
    </div>
  );
};
