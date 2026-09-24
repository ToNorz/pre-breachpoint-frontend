import React from 'react';
import { useGame } from '../../context/GameContext';
import { ViewType } from '../../types';

const TABS: { label: string; view: ViewType }[] = [
  { label: 'OVERVIEW', view: 'ADMIN' },
  { label: 'LIVE LEADERBOARD', view: 'ADMIN_LEADERBOARD' },
  { label: 'CHALLENGES', view: 'ADMIN_CHALLENGES' },
  { label: 'TEAMS', view: 'ADMIN_TEAMS' },
  { label: 'LIVE ACTIVITY', view: 'ADMIN_ACTIVITY' },
];

export const AdminNav: React.FC = () => {
  const {
    currentView,
    navigateTo,
    currentUser,
    logout,
  } = useGame();

  return (
    <div className="border-b border-[#1E2536] bg-[#0A0D15] scan-faint">
      <div className="px-6 py-3 border-b border-[#1E2536]/60 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E0A83E] shadow-[0_0_8px_#E0A83E]" />
            <span className="text-[12px] tracking-[0.25em] text-[#E0A83E] font-bold font-display">
              BREACHPOINT // COMMAND ARCHIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#8B93A9] tracking-[0.1em]">
            OPERATIVE: <strong className="text-[#F2F5FA]">{currentUser?.username ?? 'ADMIN'}</strong>
          </span>
          <button
            onClick={() => navigateTo('DASHBOARD')}
            className="px-3 py-1 border border-[#5ED6E3]/40 text-[10px] tracking-[0.18em] text-[#5ED6E3] hover:bg-[#5ED6E3]/[0.08] cursor-pointer shadow-[0_0_15px_rgba(94,214,227,0.1)] hover:shadow-[0_0_20px_rgba(94,214,227,0.2)]"
          >
            PLAY AS OPERATIVE →
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 text-[10px] tracking-[0.18em] text-[#E84D7E] hover:text-[#FF6B9B] font-bold cursor-pointer transition-colors"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>

      <div className="px-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const on = currentView === t.view;
          return (
            <button
              key={t.view}
              onClick={() => navigateTo(t.view)}
              className={`px-4 py-2.5 text-[11px] tracking-[0.18em] cursor-pointer transition-colors whitespace-nowrap ${
                on
                  ? 'text-[#E0A83E] bg-[#E0A83E]/[0.08] border-b-2 border-[#E0A83E] font-semibold'
                  : 'text-[#5A6379] hover:text-[#8B93A9]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
