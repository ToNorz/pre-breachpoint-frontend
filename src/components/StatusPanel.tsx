import React from 'react';
import { useGame } from '../context/GameContext';

export const StatusPanel: React.FC = () => {
  const {
    teamName, formattedTimer, score, rank, solvedSlots, skips,
    rewardMultiplier, setStoryOpen, board,
  } = useGame();

  const solvedTotal = board?.solveCount ?? solvedSlots.length;

  return (
    <div className="sticky top-0 z-30 border-b border-[#222B3D] bg-[#0A0D15]/95 backdrop-blur-md px-5 sm:px-8 py-4 sm:py-4.5 min-h-[58px] flex items-center w-full m-0 rounded-none shadow-sm">
      <div className="w-full flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[11.5px] sm:text-[12px] tracking-[0.16em]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono">
          <span className="text-[#A6B2C8]">TEAM <b className="text-[#F2F5FA] font-bold text-[13px]">{teamName}</b></span>
          <span className="text-[#A6B2C8]">CLOSES <b className="text-[#5ED6E3] font-bold">{formattedTimer}</b></span>
          <span className="text-[#A6B2C8] flex items-center gap-1.5">
            SCORE <b className="text-[#5ED6E3] font-bold text-[13.5px] drop-shadow-[0_0_8px_rgba(94,214,227,0.35)]">{score.toLocaleString()}</b> <span className="text-[10px] text-[#8B93A9]">PTS</span>
          </span>
          {rank !== null && (
            <span className="text-[#A6B2C8] flex items-center gap-1.5">
              RANK <b className="text-[#5ED6E3] font-bold text-[12.5px] px-2 py-0.5 border border-[#5ED6E3]/40 bg-[#5ED6E3]/10">#{rank}</b>
            </span>
          )}
          <span className="text-[#A6B2C8]">SOLVED <b className="text-[#F2F5FA] font-bold text-[12.5px]">{solvedTotal}</b></span>
          {skips.quota > 0 && (
            <span className="text-[#A6B2C8]">SKIPS <b className="text-[#F2F5FA] font-bold">{skips.remaining}/{skips.quota}</b></span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            onClick={() => setStoryOpen(true)}
            className="text-[#5ED6E3] hover:text-[#7CE3EE] font-bold tracking-[0.2em] transition-colors cursor-pointer"
          >
            [ SHOW STORY ]
          </button>
        </div>
      </div>
    </div>
  );
};
