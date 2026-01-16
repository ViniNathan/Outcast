import React from 'react';

export const ScanlineOverlay: React.FC = () => {
  return (
    <>
      <div className="scanlines" />
      <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
    </>
  );
};