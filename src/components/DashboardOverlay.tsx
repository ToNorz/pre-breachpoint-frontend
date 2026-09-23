import React, { useEffect } from 'react';

/**
 * Dashboard overlay shell (modal layer).
 * Z-index scale used in this app: page content z-auto → modals z-50
 * (DashboardOverlay) →
 * film grain z-60/61 (pointer-events-none, non-interactive).
 * Backdrop click closes it; body scroll is locked while open so the
 * background dashboard cannot interfere.
 */
export const DashboardOverlay: React.FC<{
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, onClose, wide, children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 scan-faint" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`w-full ${wide ? 'max-w-4xl' : 'max-w-3xl'} max-h-[85vh] overflow-y-auto border border-[#1E2536] bg-[#0B0E16] px-5 py-5 sm:px-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
          <span className="text-[11px] font-semibold tracking-[0.3em] text-[#F2F5FA]">{title}</span>
          <button onClick={onClose} aria-label={`Close ${title}`} className="text-[12px] font-bold tracking-[0.2em] text-[#5A6379] hover:text-[#F2F5FA] cursor-pointer">
            [X]
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
