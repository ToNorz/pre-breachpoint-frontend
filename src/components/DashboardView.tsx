import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';

const DIFF_COLOR: Record<string, string> = { easy: '#5ED6E3', medium: '#E0A83E', hard: '#E84D7E', expert: '#F2F5FA' };

export const DashboardView: React.FC = () => {
  const { navigateTo, board, team } = useGame();

  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const challenges = board?.challenges || [];
  
  // Extract unique categories from challenges
  const categories = ['ALL', ...Array.from(new Set(challenges.map((c) => c.category)))];
  
  const visibleChallenges = challenges.filter((challenge) =>
    categoryFilter === 'ALL' || challenge.category === categoryFilter,
  );

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="w-full mx-auto px-5 sm:px-8 py-10">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1E2536] pb-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.25em] text-[#5ED6E3]">CTF CHALLENGES</div>
              <div className="mt-1 text-[10.5px] text-[#8B93A9]">
                {challenges.filter((c) => c.status === 'solved').length}/{challenges.length} SOLVED · {board?.score.toLocaleString() || 0} PTS
              </div>
            </div>
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
                {category.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleChallenges.map((challenge) => {
              return (
                <button
                  key={challenge.id}
                  onClick={() => navigateTo('CHALLENGE', challenge.id)}
                  className="group min-h-[150px] border border-[#1E2536] bg-[#0B0E16]/70 p-4 text-left transition-colors hover:border-[#5ED6E3]/60 hover:bg-[#0E131F] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-[#A6B2C8]">
                      {challenge.category.toUpperCase()} <span style={{ color: DIFF_COLOR[challenge.difficulty] }}>({challenge.difficulty.toUpperCase()})</span>
                    </span>
                    <span className={`text-[9px] font-bold tracking-[0.12em] ${
                      challenge.status === 'solved' ? 'text-[#5ED6E3]' : 'text-[#8B93A9]'
                    }`}>
                      {challenge.status === 'solved' ? 'SOLVED ✓' : 'OPEN'}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-[16px] font-bold uppercase tracking-wide text-[#F2F5FA] group-hover:text-[#5ED6E3]">
                    {challenge.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium tracking-[0.12em] text-[#E2E8F0]">
                    <span>{challenge.points} PTS</span>
                    <span>{challenge.solvesCount} SOLVES</span>
                  </div>
                </button>
              );
            })}
          </div>
          {visibleChallenges.length === 0 && (
            <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-8 text-center text-[11px] tracking-[0.15em] text-[#8B93A9]">
              NO CHALLENGES FOUND
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
    </div>
  );
};
