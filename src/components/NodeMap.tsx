import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META, starFills } from '../services/backend';
import { Challenge, PathId } from '../types';

/**
 * SINGLE CONFLUENCE MAP — all three lanes on one sheet, draining
 * into one ECHO mouth. No per-path tabs; lane keys only focus.
 */
const LANE: Record<PathId, { c: string; glyph: string; lane: number }> = {
  A: { c: '#E0A83E', glyph: '▽', lane: 200 },
  B: { c: '#5ED6E3', glyph: '△', lane: 500 },
  C: { c: '#E84D7E', glyph: '◇', lane: 800 },
};

const STRATA = [
  { label: 'PAST', sub: '01 – 03', y0: 8, y1: 190 },
  { label: 'PRESENT', sub: '04 – 07', y0: 190, y1: 380 },
  { label: 'FUTURE', sub: '08 – 10', y0: 380, y1: 510 },
  { label: 'ENDGAME', sub: 'ECHO', y0: 510, y1: 600, accent: true },
];

const MOUTH = { x: 500, y: 555 };

// y for node index 1..10 falls through its era bed
function nodeY(index: number): number {
  if (index <= 3) return 40 + ((index - 1) + 0.5) * ((190 - 16) / 3);
  if (index <= 7) return 198 + ((index - 4) + 0.5) * ((380 - 198) / 4);
  return 388 + ((index - 8) + 0.5) * ((510 - 388) / 3);
}

// lanes drift toward the mouth as they descend
function nodeX(pathId: PathId, index: number): number {
  const base = LANE[pathId].lane;
  const pull = Math.pow(index / 10, 1.35) * 0.82;
  return base + (MOUTH.x - base) * pull;
}

export const NodeMap: React.FC = () => {
  const {
    activeChallengeId, navigateTo, openBriefing, notify,
    getPathChallenges, paths, pathScores, fragments, board, rewardMultiplier,
  } = useGame();

  const [selSlot, setSelSlot] = useState<string | null>(activeChallengeId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focus, setFocus] = useState<PathId | null>(null);

  const laneChallenges = (p: PathId) => getPathChallenges(p);
  const allNodes = (['A', 'B', 'C'] as PathId[]).flatMap(laneChallenges);
  const bySlot = (slot: string | null) => allNodes.find((c) => c.slot === slot) ?? null;

  const hovered = bySlot(hoverId);
  const teeth = fragments.length;
  const solvedTotal = board?.solveCount ?? 0;
  const nodeTotal = allNodes.length;

  const lanePts = (p1: { x: number; y: number }[]) =>
    [...p1.map((p) => `${p.x},${p.y}`), `${MOUTH.x},${MOUTH.y}`].join(' ');

  const dimmed = (p: PathId) => focus !== null && focus !== p;

  /** A node opens its briefing; anything without server content says why not. */
  const openNode = (c: Challenge) => {
    if (!c.id) {
      notify(
        'info',
        c.status === 'locked' ? 'NOT YET REVEALED' : c.status === 'skipped' ? `${c.slot} SKIPPED` : `${c.slot} COMPLETED`,
        c.status === 'locked'
          ? 'Solve the open nodes on this path to surface this one.'
          : c.status === 'skipped'
            ? 'This node was skipped, but your team can return and solve it anytime.'
            : 'Already completed by your team.',
      );
      return;
    }
    setSelSlot(c.slot);
    openBriefing(c.slot);
  };

  return (
    <div className="flex-1 bg-[#07090F] scan-faint m-0 p-0">
      <div className="px-4 sm:px-6 pt-0">
        {/* lane keys (focus) + vitals */}
        <div className="flex flex-wrap items-stretch gap-2">
          <span className="self-center text-[11px] tracking-[0.3em] text-[#5ED6E3] font-bold mr-1">CONFLUENCE</span>
          {(['A', 'B', 'C'] as PathId[]).map((p) => {
            const on = focus === p;
            return (
              <button
                key={p}
                id={`btn-tab-path-${p.toLowerCase()}`}
                onClick={() => setFocus((f) => (f === p ? null : p))}
                title={on ? 'Show all lanes' : `Focus lane ${p}`}
                className={`px-4 py-2.5 border text-[11.5px] font-semibold tracking-[0.18em] transition-colors cursor-pointer ${
                  on
                    ? 'bg-[#141A2B] text-[#F2F5FA] border-[#5ED6E3]/60'
                    : 'border-[#2B354C] bg-[#0B0E16]/80 text-[#C6CCDA] hover:text-[#F2F5FA] hover:border-[#414E6B]'
                }`}
                style={on ? { borderColor: `${LANE[p].c}88`, boxShadow: `inset 0 2px 0 ${LANE[p].c}` } : {}}
              >
                <span style={{ color: LANE[p].c }}>{LANE[p].glyph}</span> {p}{' '}
                {paths.find((x) => x.code === p)?.name ?? ''}
              </button>
            );
          })}
          <div className="flex flex-wrap gap-2 lg:ml-auto text-[11px] tracking-[0.12em]">
            <span className="px-3.5 py-2.5 border border-[#2B354C] bg-[#0B0E16]/80 text-[#C6CCDA] flex items-center gap-1.5 font-medium">
              <span className="text-[#E0A83E] text-[13px]">★</span> <b className="text-[#F2F5FA] font-bold font-mono">{teeth}/3</b> <span className="text-[#A6B2C8] font-semibold tracking-[0.15em]">FRAGMENTS</span>
            </span>
          </div>
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] tracking-[0.25em] text-[#A6B2C8]">
          <span><span className="text-[#E0A83E]">▽</span> WHO <b className="text-[#F2F5FA]">{pathScores.pathA}</b></span>
          <span><span className="text-[#5ED6E3]">△</span> HOW <b className="text-[#F2F5FA]">{pathScores.pathB}</b></span>
          <span><span className="text-[#E84D7E]">◇</span> WHY <b className="text-[#F2F5FA]">{pathScores.pathC}</b></span>
          <span><span className="text-[#F2F5FA]">●</span> HELD</span>
          <span><span className="text-[#5ED6E3]">○</span> NEXT</span>
          <span><span className="text-[#8B93A9] font-bold">×</span> <b className="text-[#C6CCDA]">SEALED</b></span> 
          <span className="ml-auto">PRIED: <b className="text-[#F2F5FA]">{solvedTotal}</b>/{nodeTotal}</span>
        </div>
      </div>

      <div className="mt-0 border-t border-[#1E2536]">
        {/* unified chart */}
        <div className="relative overflow-x-auto p-4">
          <div className="min-w-[860px] max-w-[1060px] mx-auto">
            <svg viewBox="0 0 1000 600" className="w-full h-auto select-none">
              {/* strata beds */}
              {STRATA.map((s) => (
                <g key={s.label}>
                  <rect x="90" y={s.y0} width="890" height={s.y1 - s.y0} fill={s.accent ? '#E84D7E08' : 'transparent'} stroke="#364158" strokeWidth="1.3" strokeDasharray={s.accent ? '' : '4 4'} />
                  <text x="10" y={s.y0 + 20} fill={s.accent ? '#E84D7E' : '#5ED6E3'} fontSize="11" fontWeight="bold" letterSpacing="3" fontFamily="IBM Plex Mono">{s.label}</text>
                  <text x="10" y={s.y0 + 35} fill="#A6B2C8" fontSize="8.5" fontWeight="500" letterSpacing="1.5" fontFamily="IBM Plex Mono">{s.sub}</text>
                </g>
              ))}

              {/* lane threads */}
              {(['A', 'B', 'C'] as PathId[]).map((p) => {
                const nodes = laneChallenges(p).map((c) => ({ x: nodeX(p, c.index), y: nodeY(c.index) }));
                return (
                  <g key={p} opacity={dimmed(p) ? 0.18 : 1}>
                    <polyline points={lanePts(nodes)} fill="none" stroke="#2C3550" strokeWidth="6" opacity="0.5" />
                    <polyline points={lanePts(nodes)} fill="none" stroke={LANE[p].c} strokeWidth="2.4" strokeDasharray="8 5" opacity="0.95" />
                    {/* solid weld over held stretches */}
                    {laneChallenges(p).slice(0, -1).map((c, i) => {
                      if (c.status !== 'solved') return null;
                      const a = nodes[i];
                      const b = nodes[i + 1];
                      return <line key={c.slot} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LANE[p].c} strokeWidth="2.8" opacity="1" />;
                    })}
                    {/* lane tag */}
                    <text x={LANE[p].lane} y={30} textAnchor="middle" fontSize="10" letterSpacing="2" fill={LANE[p].c} fontFamily="IBM Plex Mono" opacity="0.9">
                      {LANE[p].glyph} LANE {p}
                    </text>
                  </g>
                );
              })}

              {/* seals — all 30 */}
              {(['A', 'B', 'C'] as PathId[]).map((p) =>
                laneChallenges(p).map((c) => {
                  const x = nodeX(p, c.index);
                  const y = nodeY(c.index);
                  const isSel = selSlot === c.slot;
                  const isHov = hoverId === c.slot;
                  const held = c.status === 'solved';
                  const wasSkipped = c.status === 'skipped';
                  const sealed = c.status === 'locked';
                  const nextUp = c.status === 'open';
                  return (
                    <g
                      key={c.slot}
                      transform={`translate(${x},${y})`}
                      opacity={dimmed(p) ? 0.25 : 1}
                      className="cursor-pointer"
                      onClick={() => openNode(c)}
                      onMouseEnter={() => setHoverId(c.slot)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                      {(isSel || isHov) && (
                        <rect x="-26" y="-26" width="52" height="52" fill="none" stroke="#F2F5FA" strokeWidth="1" strokeDasharray="4 3" transform="rotate(45)" opacity="0.85" />
                      )}
                      {nextUp && (
                        <circle r="22" fill="none" stroke={LANE[p].c} strokeWidth="1" opacity="0.55">
                          <animate attributeName="r" values="18;27;18" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.55;0;0.55" dur="3s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {held && (
                        <g fill={LANE[p].c} opacity="0.9">
                          <rect x="-11" y="-34" width="4.5" height="4.5" transform="rotate(45 -11 -34)" />
                          <rect x="-2.2" y="-34" width="4.5" height="4.5" transform="rotate(45 -2.2 -34)" />
                          <rect x="6.5" y="-34" width="4.5" height="4.5" transform="rotate(45 6.5 -34)" />
                        </g>
                      )}
                      <circle r="16" fill={held ? `${LANE[p].c}2E` : wasSkipped ? '#E0A83E1A' : '#0B0E16'} stroke={held || nextUp ? (nextUp ? '#F2F5FA' : LANE[p].c) : wasSkipped ? '#E0A83E' : '#455273'} strokeWidth={held || nextUp ? 2 : wasSkipped ? 1.8 : 1.3} />
                      <text y="4.5" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill={held || nextUp ? '#F2F5FA' : wasSkipped ? '#E0A83E' : sealed ? '#8B93A9' : '#C6CCDA'} fontFamily="IBM Plex Mono">
                        {held ? '●' : wasSkipped ? '↷' : sealed ? '×' : String(c.index).padStart(2, '0')}
                      </text>
                      <text y="31" textAnchor="middle" fontSize="8.5" fontWeight="500" letterSpacing="1" fill={held || nextUp || isSel ? '#F2F5FA' : '#9BA6BC'} fontFamily="IBM Plex Mono">
                        {p}-{String(c.index).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })
              )}

              {/* the single mouth */}
              <g transform={`translate(${MOUTH.x},${MOUTH.y})`} className="cursor-pointer" onClick={() => navigateTo('CONVERGENCE')}>
                <circle r="34" fill="#E84D7E14" stroke="#E84D7E" strokeWidth="1.5">
                  <animate attributeName="r" values="32;36;32" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle r="24" fill="none" stroke="#E84D7E" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.95" />
                <circle r="4" fill={teeth === 3 ? '#5ED6E3' : '#2C3550'}>
                  {teeth === 3 && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
                </circle>
                <g transform="translate(0,48)">
                  <rect x="-70" y="-10" width="140" height="20" fill="#07090F" stroke="#E84D7E88" />
                  <text y="4" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#C6CCDA" fontFamily="IBM Plex Mono">ECHO · {teeth}/3 TEETH</text>
                </g>
              </g>

              {/* Hover popup overlay — rendered last so it sits cleanly on top of all nodes and lane threads */}
              {hovered && hovered.status !== 'locked' && (() => {
                const p = hovered.slot[0] as PathId;
                const x = nodeX(p, hovered.index);
                const y = nodeY(hovered.index);
                // For node 1 across all branches (c.index <= 1 or y < 110), flip downwards so it never goes into the header
                const popupBelow = hovered.index <= 1 || y < 110;
                const ty = popupBelow ? y + 74 : y - 70;
                const starColor = DIFFICULTY_META[hovered.difficulty].color;
                const fills = starFills(hovered.difficulty);

                return (
                  <g transform={`translate(${x},${ty})`} pointerEvents="none">
                    <rect x="-112" y="-40" width="224" height="80" fill="#000000" opacity="0.75" rx="2" />
                    <rect x="-110" y="-38" width="220" height="76" fill="#0B0E16" stroke={LANE[p].c} strokeWidth="1.5" rx="1" />
                    <text y="-20" textAnchor="middle" fontSize="9" fontWeight="bold" letterSpacing="2" fill="#F2F5FA" fontFamily="IBM Plex Mono">
                      {hovered.category.toUpperCase()}
                    </text>
                    <text y="-4" textAnchor="middle" fontSize="8.5" fontWeight="500" letterSpacing="1.5" fill="#C6CCDA" fontFamily="IBM Plex Mono">
                      {(hovered.title || '').toUpperCase().slice(0, 28)}
                    </text>
                    <text y="11" textAnchor="middle" fontSize="8" letterSpacing="1" fill={hovered.status === 'skipped' ? '#E0A83E' : '#A6B2C8'} fontFamily="IBM Plex Mono">
                      {hovered.era} · {hovered.currentPoints} PTS{hovered.status === 'skipped' ? ' · SKIPPED (OPEN)' : ''}
                    </text>
                    <text y="27" textAnchor="middle" fontSize="11" letterSpacing="3" fontFamily="IBM Plex Mono">
                      {fills.map((f, i) => (
                        f === 1 ? (
                          <tspan key={i} fill={starColor}>★</tspan>
                        ) : f === 0.5 ? (
                          <tspan key={i} fill={starColor} opacity={0.5}>★</tspan>
                        ) : (
                          <tspan key={i} fill="#454C61">☆</tspan>
                        )
                      ))}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
          {hovered && hovered.status !== 'locked' && (() => {
            const starColor = DIFFICULTY_META[hovered.difficulty].color;
            const fills = starFills(hovered.difficulty);
            return (
              <div className="max-w-[1060px] mx-auto mt-1 text-[11px] tracking-[0.1em] text-[#A6B2C8] flex items-center gap-2">
                <span className="text-[#F2F5FA] font-medium">{hovered.category.toUpperCase()}</span>
                <span className="text-[#C6CCDA] font-medium">{(hovered.title || '').toUpperCase()}</span>
                <span className="tracking-[0.2em]">
                  {fills.map((f, i) => (
                    f === 1 ? (
                      <span key={i} style={{ color: starColor }}>★</span>
                    ) : f === 0.5 ? (
                      <span key={i} style={{ color: starColor, opacity: 0.5 }}>★</span>
                    ) : (
                      <span key={i} className="text-[#454C61]">☆</span>
                    )
                  ))}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
