import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';
import { WelcomeGate } from './WelcomeGate';
import { TONE } from '../data/pathsData';
import { PathId } from '../types';

export const DashboardView: React.FC = () => {
  const {
    paths, chosenPath, choosePath, navigateTo,
    getPathChallenges, welcome, busy, team,
  } = useGame();

  const [pendingCommit, setPendingCommit] = useState<PathId | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const activePath = paths.find((p) => p.isActive) ?? null;

  const welcomeOpen = !!welcome && welcome.status !== 'solved';
  const challengePath = activePath?.code ?? chosenPath ?? 'A';
  const dashboardChallenges = getPathChallenges(challengePath);
  const categories = ['ALL', ...Array.from(new Set(
    dashboardChallenges.map((challenge) => challenge.category),
  )).sort((a, b) => a.localeCompare(b))];
  const visibleChallenges = dashboardChallenges.filter((challenge) =>
    categoryFilter === 'ALL' || challenge.category === categoryFilter,
  );

  const renderPathAction = (code: PathId) => {
    if (chosenPath) return null;
    if (welcomeOpen) {
      return (
        <button
          id={`btn-enter-path-${code.toLowerCase()}`}
          disabled
          title={`Solve ${welcome?.title ?? 'the welcome challenge'} first — it gates the CTF.`}
          className="mt-3 w-full px-4 py-2.5 text-[11.5px] font-bold tracking-[0.18em] border border-[#2B354C] bg-[#0E131F] text-[#C6CCDA] cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-[#E84D7E]">🔒</span> SEALED — DECODE FIRST
        </button>
      );
    }
    return (
      <button
        id={`btn-enter-path-${code.toLowerCase()}`}
        onClick={() => setPendingCommit(code)}
        disabled={busy}
        className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)]"
        style={{ background: TONE[code] }}
      >
        START CTF →
      </button>
    );
  };

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="w-full mx-auto px-5 sm:px-8 py-10">
        <WelcomeGate />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1E2536] pb-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.25em] text-[#5ED6E3]">CTF CHALLENGES</div>
              <div className="mt-1 text-[10.5px] text-[#8B93A9]">
                {activePath ? `${activePath.solved}/${activePath.total} SOLVED · ${activePath.points.toLocaleString()} PTS` : 'CHOOSE A CATEGORY AND START SOLVING'}
                {activePath?.isActive && <span className="ml-2 text-[#5ED6E3]">● ACTIVE</span>}
              </div>
            </div>
            {!chosenPath && <div>{renderPathAction('A')}</div>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter challenges by category">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`border px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] cursor-pointer transition-colors ${
                  categoryFilter === category
                    ? 'border-[#5ED6E3]/70 bg-[#5ED6E3]/10 text-[#5ED6E3]'
                    : 'border-[#1E2536] text-[#8B93A9] hover:border-[#5ED6E3]/40 hover:text-[#C6CCDA]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleChallenges.map((challenge) => {
              return (
                <button
                  key={challenge.slot}
                  onClick={() => navigateTo('CHALLENGE', challenge.slot)}
                  className="group min-h-[150px] border border-[#1E2536] bg-[#0B0E16]/70 p-4 text-left transition-colors hover:border-[#5ED6E3]/60 hover:bg-[#0E131F] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-[#5ED6E3]">{challenge.slot}</span>
                    <span className={`text-[9px] font-bold tracking-[0.12em] ${
                      challenge.status === 'solved' ? 'text-[#5ED6E3]' : 'text-[#8B93A9]'
                    }`}>
                      {challenge.status === 'solved' ? 'SOLVED ✓' : 'OPEN'}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-[16px] font-bold uppercase tracking-wide text-[#F2F5FA] group-hover:text-[#5ED6E3]">
                    {challenge.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] tracking-[0.12em] text-[#8B93A9]">
                    <span>{challenge.category.toUpperCase()}</span>
                    <span>{challenge.currentPoints} PTS</span>
                  </div>
                  <div className="mt-3 text-[9px] tracking-[0.12em] text-[#5A6379]">{challenge.difficulty.toUpperCase()} · {challenge.era}</div>
                </button>
              );
            })}
          </div>
          {visibleChallenges.length === 0 && (
            <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-8 text-center text-[11px] tracking-[0.15em] text-[#8B93A9]">
              NO CHALLENGES IN THIS CATEGORY YET
            </div>
          )}
        </section>

        {team?.joinCode && (
          <div className="mt-6 p-4 border border-[#2B354C] bg-[#0A0D15]/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#5ED6E3] shadow-[0_0_8px_#5ED6E3]" />
              <div>
                <span className="text-[10.5px] tracking-[0.25em] text-[#A6B2C8] font-semibold">TEAM: </span>
                <span className="text-[13px] font-bold text-[#F2F5FA] font-mono">{team.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10.5px] tracking-[0.25em] text-[#A6B2C8] font-semibold">JOIN CODE:</span>
              <span className="px-3 py-1 font-mono text-[14px] font-bold tracking-[0.2em] border border-[#5ED6E3]/60 bg-[#5ED6E3]/15 text-[#5ED6E3] select-all">
                {team.joinCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {pendingCommit && (
        <DashboardOverlay title={`START CTF`} onClose={() => setPendingCommit(null)}>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">
            Start the CTF challenges for your team.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPendingCommit(null)}
              className="text-[11px] tracking-[0.2em] text-[#8B93A9] hover:text-[#F2F5FA] cursor-pointer transition-colors"
            >
              ← CANCEL
            </button>
            <button
              id="btn-confirm-choose-path"
              onClick={() => {
                void choosePath(pendingCommit);
                setPendingCommit(null);
              }}
              disabled={busy}
              className="px-6 py-2.5 text-[#07090F] text-[12px] font-bold tracking-[0.2em] cursor-pointer bg-[#5ED6E3] hover:brightness-110"
            >
              START CTF →
            </button>
          </div>
        </DashboardOverlay>
      )}
    </div>
  );
};
