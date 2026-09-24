import React from 'react';
import { useGame } from '../context/GameContext';

export const ToastBanner: React.FC = () => {
  const { toast, dismissToast } = useGame();
  if (!toast) return null;
  const accent = toast.type === 'success' ? '#5ED6E3' : toast.type === 'error' ? '#E84D7E' : '#E0A83E';
  const hasPoints = 'points' in toast;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <button onClick={dismissToast} className="text-[12px] tracking-[0.08em] text-[#F2F5FA] bg-[#0B0E16] border border-[#1E2536] border-l-2 px-5 py-3 whitespace-nowrap" style={{ borderLeftColor: accent }}>
        {toast.title} {hasPoints ? `+${(toast as any).points}` : ''} <span className="text-[#5A6379]">· {toast.message.slice(0, 80)}</span> ✕
      </button>
    </div>
  );
};
