import React from 'react';
import { useGame } from '../context/GameContext';

/**
 * Entry-gate content (incident strip, site cards, verdict line, actions).
 * Shared by the standalone gate route and the combined landing page.
 */
export const GateHero: React.FC = () => {
  const { navigateTo, currentUser } = useGame();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col items-center">
      <div className="text-[11px] tracking-[0.45em] text-[#8B93A9]">INCIDENT LOG — 03:17:42 UTC</div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <div className="border border-[#1E2536] bg-[#0B0E16]/60 px-4 py-3.5">
          <div className="text-[11px] font-semibold tracking-[0.3em] text-[#E0A83E]">LISBON</div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#8B93A9]">
            Research server, flooded sub-basement. No grid power since 2011. <span className="text-[#F2F5FA] font-medium">Powered on.</span>
          </p>
        </div>
        <div className="border border-[#1E2536] bg-[#0B0E16]/60 px-4 py-3.5">
          <div className="text-[11px] font-semibold tracking-[0.3em] text-[#5ED6E3]">BUSAN</div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#8B93A9]">
            Air-gapped cold-storage array, physically disconnected. <span className="text-[#F2F5FA] font-medium">Writing to its own disk.</span>
          </p>
        </div>
        <div className="border border-[#1E2536] bg-[#0B0E16]/60 px-4 py-3.5">
          <div className="text-[11px] font-semibold tracking-[0.3em] text-[#9D8DF1]">REYKJAVIK</div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#8B93A9]">
            Government subnet, decommissioned 2009. <span className="text-[#F2F5FA] font-medium">Answered a ping nobody sent.</span>
          </p>
        </div>
      </div>

      <h1 className="mt-14 text-center font-display font-bold uppercase leading-[1.04] tracking-tight text-[#F2F5FA] text-4xl sm:text-6xl">
        We have already<br />tried this once.
      </h1>

      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[10.5px] tracking-[0.35em] text-[#5A6379]">
        <span>41 BYTES</span><span>·</span><span>NO SENDER IP</span><span>·</span><span>NO ROUTE</span><span>·</span><span>ATTACHMENT: ECHO</span>
      </div>

      <p className="mt-14 max-w-2xl text-center text-[14.5px] leading-relaxed text-[#9AA2B5]">
        Three organizations opened three investigations, unaware the other two existed. You are joining one of them. The past never disconnected.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          id="btn-open-investigation"
          onClick={() => navigateTo(currentUser ? 'DASHBOARD' : 'LOGIN')}
          className="px-10 py-4 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[13px] font-bold tracking-[0.25em] transition-colors cursor-pointer"
        >
          {currentUser ? 'ENTER DASHBOARD →' : 'OPERATIVE LOGIN →'}
        </button>
      </div>

      <button onClick={() => navigateTo('DASHBOARD')} className="mt-6 text-[11px] tracking-[0.25em] text-[#454C61] hover:text-[#8B93A9] transition-colors cursor-pointer">
        OR OPEN YOUR DASHBOARD →
      </button>

      <div className="mt-auto pt-14 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] tracking-[0.3em] text-[#454C61]">
        <span>KEYS</span><span className="text-[#5ED6E3]/70">1 2 3 PATH</span><span>·</span><span>M MAP</span><span>·</span><span>L BOARD</span><span>·</span><span>SPACE ADVANCE</span><span>·</span><span>ESC BACK</span>
      </div>
    </div>
  );
};
