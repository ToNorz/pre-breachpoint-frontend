import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META, starFills } from '../services/backend';
import { TONE } from '../data/pathsData';

const ERAS = [
  { label: '01 – 03', sub: 'WHAT HAPPENED IN 2011', x0: 0 },
  { label: '04 – 07', sub: 'HAPPENING NOW', x0: 340 },
  { label: '08 – 10', sub: 'WHAT IS COMING', x0: 740 },
  { label: 'ECHO', sub: 'CONVERGENCE', x0: 1040 },
];

/** Winding left→right trail so all 10 seals + ECHO fit in one view (no scroll). */
const NODE_X = (i: number) => 110 + i * 93;
const NODE_Y = [470, 360, 245, 165, 285, 460, 315, 190, 315, 455];

/**
 * Single-path winding trail (PATH A/B/C views).
 *
 * The path's own challenges come from the board, so a node the server has not
 * revealed draws as a sealed marker with no title — the reveal window is the
 * game, and spoiling the next three names would give it away.
 */
export const PathTrail: React.FC = () => {
  const { activePath, navigateTo, openBriefing, getPathChallenges, isPathLocked, paths, chosenPath, notify } = useGame();

  const color = TONE[activePath];
  const nodes = getPathChallenges(activePath);
  const pathObj = paths.find((p) => p.code === activePath);
  const isEnteredPrevious = !!pathObj?.isAttempted && pathObj.code !== chosenPath;
  const locked = isPathLocked(activePath);
  const next = nodes.find((c) => c.status === 'open');
  const [hoverId, setHoverId] = useState<string | null>(null);

  const pt = (i: number) => ({ x: NODE_X(i), y: NODE_Y[i] ?? 215 });
  const echo = { x: 1120, y: 315 };
  const thread = [...nodes.map((_, i) => pt(i)), echo].map((p) => `${p.x},${p.y}`).join(' ');

  /**
   * Only a node the server actually served has content to open. A node with no
   * id is either sealed or closed.
   */
  const onSealClick = (node: { slot: string; id: string; status: string }) => {
    if (node.id) {
      openBriefing(node.slot);
      return;
    }
    if (node.status === 'solved') {
      notify(
        'info',
        `${node.slot} COMPLETED`,
        'Your team has already solved this challenge.',
      );
      return;
    }
    if (node.status === 'skipped') {
      notify(
        'info',
        `${node.slot} SKIPPED`,
        'This node was skipped, but your team can return and solve it anytime.',
      );
      return;
    }
    if (locked) {
      notify(
        'error',
        `PATH ${activePath} LOCKED`,
        'Complete your current path to unlock this path for free, or switch from the dashboard.',
      );
      return;
    }
    notify('info', 'NOT YET REVEALED', 'Solve the nodes already open on this path to surface this one.');
  };

  return (
    <div className="flex-1 w-full h-full bg-[#07090F] scan-faint m-0 p-0 flex flex-col">
      {isEnteredPrevious && (
        <div className="bg-[#141A2B] border-b border-[#5ED6E3]/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-[#5ED6E3] font-bold">✦ PREVIOUS PATH (AVAILABLE TO SOLVE)</span>
            <span className="text-[#8B93A9]">· Challenges here can still be decoded and scored</span>
          </div>
          {chosenPath && (
            <button
              onClick={() => navigateTo('TRAIL', null, chosenPath)}
              className="text-[10px] text-[#5ED6E3] hover:underline cursor-pointer"
            >
              ACTIVE PATH: PATH {chosenPath} →
            </button>
          )}
        </div>
      )}
      <div className="w-full flex-1 m-0 p-0">
        <div className="border-x-0 border-t-0 border-b border-[#1E2536] bg-[#0B0E16]/40 m-0">
          <svg viewBox="0 0 1200 620" className="w-full h-auto select-none">
            {ERAS.map((e) => (
              <g key={e.label}>
                <line x1={e.x0} y1="0" x2={e.x0} y2="620" stroke="#364158" strokeWidth="1.3" strokeDasharray="4 4" />
                <text x={e.x0 + 12} y={22} fill="#5ED6E3" fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="IBM Plex Mono">{e.label}</text>
                <text x={e.x0 + 12} y={37} fill="#A6B2C8" fontSize="8.5" fontWeight="500" letterSpacing="1.5" fontFamily="IBM Plex Mono">{e.sub}</text>
              </g>
            ))}
            <line x1="1200" y1="0" x2="1200" y2="620" stroke="#364158" strokeWidth="1.3" strokeDasharray="4 4" />

            <polyline points={thread} fill="none" stroke="#2C3550" strokeWidth="6" opacity="0.5" />
            <polyline points={thread} fill="none" stroke={color} strokeWidth="2.4" strokeDasharray="8 5" opacity="0.95" />

            {nodes.map((c, i) => {
              const p = pt(i);
              const held = c.status === 'solved';
              const wasSkipped = c.status === 'skipped';
              const revealed = c.status !== 'locked';
              const isNext = !locked && next?.slot === c.slot;
              const isHov = hoverId === c.slot;
              const meta = DIFFICULTY_META[c.difficulty];
              const fills = starFills(c.difficulty);
              const labelDx = Math.min(1120, Math.max(80, p.x)) - p.x;
              const popupBelow = p.y < 170;
              return (
                <g
                  key={c.slot}
                  transform={`translate(${p.x},${p.y})`}
                  className="cursor-pointer"
                  onClick={() => onSealClick(c)}
                  onMouseEnter={() => setHoverId(c.slot)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {held && (
                    <g fill={color} opacity="0.9">
                      <rect x="-11" y="-40" width="4.5" height="4.5" transform="rotate(45 -11 -40)" />
                      <rect x="-2.2" y="-40" width="4.5" height="4.5" transform="rotate(45 -2.2 -40)" />
                      <rect x="6.5" y="-40" width="4.5" height="4.5" transform="rotate(45 6.5 -40)" />
                    </g>
                  )}
                  {isNext && (
                    <>
                      <circle r="34" fill="none" stroke={color} strokeWidth="1" opacity="0.55">
                        <animate attributeName="r" values="30;40;30" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0;0.55" dur="3s" repeatCount="indefinite" />
                      </circle>
                      {/* Highlighted YOU indicator positioned to the left so it never disturbs adjacent nodes */}
                      <g transform="translate(-34,-46)">
                        <rect x="-38" y="-11" width="46" height="22" rx="2" fill="#07090F" stroke={color} strokeWidth="1.6" />
                        <rect x="-38" y="-11" width="46" height="22" rx="2" fill={`${color}25`} />
                        <text x="-15" y="4" textAnchor="middle" fontSize="9.5" fontWeight="bold" letterSpacing="1.5" fill={color} fontFamily="IBM Plex Mono">YOU</text>
                      </g>
                    </>
                  )}
                  <circle
                    r="26"
                    fill={held ? `${color}2E` : wasSkipped ? '#E0A83E1A' : '#0B0E16'}
                    stroke={held || isNext ? color : wasSkipped ? '#E0A83E' : '#455273'}
                    strokeWidth={held || isNext ? 2.2 : wasSkipped ? 1.8 : 1.4}
                    opacity={locked && !held ? 0.75 : 1}
                  />
                  <text
                    y="7"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill={held || isNext ? '#F2F5FA' : wasSkipped ? '#E0A83E' : !revealed ? '#8B93A9' : '#C6CCDA'}
                    fontFamily="IBM Plex Mono"
                  >
                    {held ? '●' : wasSkipped ? '↷' : !revealed ? '×' : String(c.index).padStart(2, '0')}
                  </text>
                  <text
                    x={labelDx}
                    y="52"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    letterSpacing="2"
                    fill={held || isNext ? '#F2F5FA' : !revealed ? '#9BA6BC' : '#8B93A9'}
                    fontFamily="IBM Plex Mono"
                  >
                    {revealed ? c.title.slice(0, 18).toUpperCase() : 'SEALED'}
                  </text>
                  {isHov && revealed && (
                    <g transform={popupBelow ? 'translate(0,80)' : 'translate(0,-80)'}>
                      <rect x="-110" y="-38" width="220" height="76" fill="#0B0E16" stroke={color} />
                      <text y="-20" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#F2F5FA" fontFamily="IBM Plex Mono">
                        {c.category.toUpperCase()}
                      </text>
                      <text y="-4" textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="#C6CCDA" fontFamily="IBM Plex Mono">
                        {c.title.toUpperCase().slice(0, 28)}
                      </text>
                      <text y="10" textAnchor="middle" fontSize="8" letterSpacing="1" fill="#A6B2C8" fontFamily="IBM Plex Mono">
                        {c.era} · {c.currentPoints} PTS
                      </text>
                      <text y="27" textAnchor="middle" fontSize="11" letterSpacing="3" fontFamily="IBM Plex Mono">
                        {fills.map((f, fi) => (
                          f === 1 ? (
                            <tspan key={fi} fill={meta.color}>★</tspan>
                          ) : f === 0.5 ? (
                            <tspan key={fi} fill={meta.color} opacity={0.5}>★</tspan>
                          ) : (
                            <tspan key={fi} fill="#5A6379">☆</tspan>
                          )
                        ))}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            <g transform={`translate(${echo.x},${echo.y})`} className="cursor-pointer" onClick={() => navigateTo('CONVERGENCE')}>
              <circle r="30" fill="#E84D7E14" stroke="#E84D7E" strokeWidth="1.5" />
              <text y="5" textAnchor="middle" fontSize="11" letterSpacing="2" fill="#E84D7E" fontFamily="IBM Plex Mono">ECHO</text>
              <text y="48" textAnchor="middle" fontSize="8.5" letterSpacing="2" fill="#A6B2C8" fontFamily="IBM Plex Mono">CONVERGENCE</text>
            </g>
          </svg>
        </div>
        <div className="px-4 py-2.5 text-[11px] tracking-[0.2em] font-medium border-t border-[#1E2536]">
          {locked ? (
            <span className="text-[#E84D7E] font-semibold">SEALED TRAIL — VIEW ONLY · YOUR TEAM IS ON ANOTHER PATH</span>
          ) : (
            <span className="text-[#A6B2C8]">CLICK A SEAL FOR PRE-STORY → CHALLENGE · HOVER FOR DETAILS</span>
          )}
        </div>
      </div>
    </div>
  );
};
