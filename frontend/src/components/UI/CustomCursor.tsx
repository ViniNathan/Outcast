'use client';

import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 }); // Start off-screen
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      // Since we globally set `cursor: none`, we can't rely on computed cursor styles.
      // Instead, infer "clickable" via semantic elements/roles/classes.
      const clickableSelector = [
        'a[href]',
        'button',
        'input:not([type="hidden"])',
        'textarea',
        'select',
        'summary',
        '[role="button"]',
        '[role="link"]',
        '[tabindex]:not([tabindex="-1"])',
        '.cursor-pointer',
        '[data-cursor="pointer"]',
      ].join(',');

      const isClickable = target?.closest?.(clickableSelector) !== null;
      
      setIsPointer(isClickable);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[9999] mix-blend-exclusion"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`
      }}
    >
      {/* Reticle Container */}
      <div className={`relative -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out ${
        isPointer ? 'scale-125' : 'scale-100'
      }`}>
        
        {/* Center Dot */}
        <div className={`w-1 h-1 bg-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors ${
            isClicking ? 'bg-white shadow-[0_0_10px_white]' : ''
        }`} />
        
        {/* Crosshair Lines (Hidden on Hover) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[1px] bg-red-600/60 transition-all duration-300 ${
            isPointer ? 'w-0 opacity-0' : 'w-12'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[1px] bg-red-600/60 transition-all duration-300 ${
            isPointer ? 'h-0 opacity-0' : 'h-12'
        }`} />

        {/* Hover Target Box (Visible on Hover) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-red-600 transition-all duration-300 ${
            isPointer ? 'opacity-100 rotate-45 scale-100' : 'opacity-0 scale-150 rotate-0'
        }`} />
        
        {/* Decoration Corners for Target Box */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 transition-all duration-500 delay-75 ${
            isPointer ? 'opacity-50 rotate-[225deg] scale-100' : 'opacity-0 scale-50'
        }`}>
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-red-500" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-red-500" />
        </div>

      </div>
    </div>
  );
};