import React from 'react';
import { useGame } from '../context/GameContext';
import { ViewType } from '../types';

const NAV: { label: string; view: ViewType }[] = [
  { label: 'DASHBOARD', view: 'DASHBOARD' },
  { label: 'LEADERBOARD', view: 'BOARD' },
  { label: 'TEAM', view: 'TEAM' },
];

export const Header: React.FC = () => {
  const {
    currentView, navigateTo,
    board, currentUser, logout,
  } = useGame();

  const score = board?.score ?? 0;
  const go = (view: ViewType) => navigateTo(view);
  const isOn = (view: ViewType) => currentView === view;

  return (
    <>
      <div className="lg:hidden border-b border-[#1E2536] bg-[#0B0E16] px-4 py-3 flex items-center justify-between">
        <button id="brand-logo-btn" onClick={() => navigateTo('LOGIN')} className="font-display tracking-[0.3em] text-sm text-[#F2F5FA]">BREACH POINT</button>
        <button
          id="header-points-hud"
          className="text-[13px] font-bold text-[#5ED6E3] font-mono drop-shadow-[0_0_8px_rgba(94,214,227,0.35)]"
        >
          ■ {score.toLocaleString()} PTS
        </button>
      </div>
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-b border-[#1E2536] bg-[#07090F] overflow-x-auto">
        {NAV.map((n) => {
          const on = isOn(n.view);
          return (
            <button key={n.view} id={`nav-mobile-${n.view.toLowerCase()}`}
              onClick={() => go(n.view)}
              className={`text-[11px] tracking-[0.15em] py-1 px-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${on ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#8B93A9]'}`}>
              <span>{n.label}</span>
            </button>
          );
        })}
        {currentUser?.isAdmin && (
          <button id="nav-btn-admin-mobile" onClick={() => go('ADMIN')}
            className={`text-[11px] tracking-[0.15em] py-1 whitespace-nowrap cursor-pointer ${currentView.startsWith('ADMIN') ? 'text-[#E0A83E]' : 'text-[#E0A83E]/60'}`}>
            ADMIN
          </button>
        )}
      </div>

      <aside className="hidden lg:flex w-[224px] shrink-0 flex-col bg-[#0A0D15] min-h-screen sticky top-0 h-screen m-0 border-r border-[#1E2536]">
        <div className="px-5 pt-5 pb-4 border-b border-[#1E2536]">
          <div className="flex items-start">
            <button id="brand-logo-btn" onClick={() => navigateTo('LOGIN')} className="text-left">
              <div className="font-display text-[17px] font-semibold tracking-[0.28em] text-[#F2F5FA]">BREACH POINT</div>
              <div className="mt-1.5 text-[8.5px] leading-relaxed tracking-[0.22em] text-[#5ED6E3] font-medium">BY AXIOS</div>
            </button>
          </div>
        </div>

        <div className="px-5 py-3.5 border-b border-[#1E2536] bg-[#07090F]/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] text-[#C6CCDA] font-bold">SCORE</span>
            <button
              id="header-points-hud"
              className="font-mono text-[13.5px] font-bold text-[#5ED6E3] hover:text-[#7CE3EE] drop-shadow-[0_0_8px_rgba(94,214,227,0.35)] cursor-pointer transition-colors"
            >
              ■ {score.toLocaleString()} <span className="text-[10px] tracking-wider text-[#A6B2C8]">PTS</span>
            </button>
          </div>
        </div>

        <nav className="py-2">
          {NAV.map((n) => {
            const on = isOn(n.view);
            return (
              <button key={n.view} id={`nav-btn-${n.view.toLowerCase()}`}
                onClick={() => go(n.view)}
                className={`w-full flex items-center justify-between px-5 py-[9px] font-display text-[13.5px] tracking-[0.18em] transition-colors cursor-pointer group ${on ? 'text-[#5ED6E3] bg-[#5ED6E3]/[0.06]' : 'text-[#8B93A9] hover:text-[#D5DBE7]'}`}
                style={on ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}>
                <span>{n.label}</span>
              </button>
            );
          })}
          {currentUser?.isAdmin && (
            <>
              <div className="mx-5 my-2 border-t border-[#1E2536]" />
              <button id="nav-btn-admin" onClick={() => go('ADMIN')}
                className={`w-full flex items-center px-5 py-[9px] font-display text-[13.5px] tracking-[0.18em] transition-colors cursor-pointer ${currentView.startsWith('ADMIN') ? 'text-[#E0A83E] bg-[#E0A83E]/[0.06]' : 'text-[#E0A83E]/60 hover:text-[#E0A83E]'}`}
                style={currentView.startsWith('ADMIN') ? { boxShadow: 'inset 2px 0 0 #E0A83E' } : {}}>
                <span>ADMIN</span>
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-[#1E2536] px-5 py-4 text-[11px] tracking-[0.14em] flex justify-center">
          {currentUser && (
            <button onClick={logout} className="text-[#E84D7E] hover:text-[#FF6B9B] hover:brightness-125 font-bold transition-colors cursor-pointer">[ LOGOUT ]</button>
          )}
        </div>
      </aside>
    </>
  );
};
