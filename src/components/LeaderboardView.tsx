import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TONE } from '../data/pathsData';

const relativeTime = (iso: string | null): string => {
  if (!iso) return '—';
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return 'just now';
  const mins = Math.floor(delta / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * The scoreboard, read from `/events/:id/scoreboard`.
 *
 * It shows what the server publishes and nothing else: rank, team, score,
 * solve count, last solve. The per-path breakdown is only rendered for the
 * viewer's own team, because that is the only team whose path split the API
 * exposes — inventing the other columns is what the old mock did.
 */
export const LeaderboardView: React.FC = () => {
  const {
    scoreboard, scoreboardFrozen, loadScoreboard, teamName,
    pathScores, score, rank, paths, navigateTo,
  } = useGame();
  const [q, setQ] = useState('');

  useEffect(() => {
    void loadScoreboard();
    const timer = setInterval(() => void loadScoreboard(), 30_000);
    return () => clearInterval(timer);
  }, [loadScoreboard]);

  const shown = scoreboard.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const medal = ['#E0A83E', '#5ED6E3', '#E84D7E'];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="text-[11px] tracking-[0.3em] text-[#5ED6E3] font-bold">■ OPERATIVE LEADERBOARD</div>
          <div className="text-[11.5px] tracking-[0.2em] font-semibold px-3 py-1 border border-[#1E2536] bg-[#0B0E16] text-[#C6CCDA] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5ED6E3] shadow-[0_0_6px_#5ED6E3]" />
            <span className="text-[#5ED6E3] font-bold font-mono text-[13px]">{scoreboard.length}</span>
            <span>CELLS COMPETING</span>
          </div>
        </div>

        {scoreboardFrozen && (
          <div className="mb-4 border border-[#E0A83E]/40 bg-[#E0A83E]/[0.05] px-5 py-3 text-[11px] tracking-[0.15em] text-[#E0A83E]">
            ■ BOARD FROZEN — STANDINGS AS OF THE FREEZE. YOUR SOLVES STILL COUNT.
          </div>
        )}

        {/* your standing - highlighted blue box */}
        <div className="border-2 border-[#5ED6E3] bg-gradient-to-r from-[#07131F]/90 via-[#0B0E16]/95 to-[#07131F]/90 shadow-[0_0_25px_rgba(94,214,227,0.18)] p-5 relative">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2536] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-[#5ED6E3] shadow-[0_0_8px_#5ED6E3]" />
              <span className="text-[10.5px] tracking-[0.25em] text-[#5ED6E3] font-bold">CURRENT CELL STANDING</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] text-[#A6B2C8] font-medium">STATUS:</span>
              <span className="text-[10px] font-bold tracking-[0.2em] px-2.5 py-0.5 border border-[#5ED6E3]/60 bg-[#5ED6E3]/15 text-[#5ED6E3]">
                {rank !== null ? `RANK #${rank}` : 'UNRANKED'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] tracking-[0.2em] text-[#9BA6BC] font-medium">CELL NAME</div>
              <div className="mt-1 font-display text-2xl sm:text-3xl text-[#F2F5FA] font-bold tracking-wide flex items-center gap-3">
                {teamName}
                <span className="text-[9px] font-mono tracking-widest bg-[#5ED6E3] text-[#07090F] font-bold px-1.5 py-0.5">
                  YOU
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-[0.2em] text-[#9BA6BC] font-medium">TOTAL SCORE</div>
              <div className="mt-1 font-display text-3xl sm:text-4xl leading-none text-[#5ED6E3] font-bold drop-shadow-[0_0_12px_rgba(94,214,227,0.35)]">
                {score.toLocaleString()} <span className="text-sm font-mono tracking-wider font-semibold text-[#8B93A9]">PTS</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E2536]/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <span className="text-[#C6CCDA] font-semibold tracking-wider">PATH BREAKDOWN:</span>
              {(['A'] as const).map((code) => {
                const path = paths.find((p) => p.code === code);
                const pts = pathScores.pathA;
                return (
                  <span key={code} className="font-mono font-medium" style={{ color: TONE[code] }}>
                    PATH {code}: <b className="text-[#F2F5FA]">{pts.toLocaleString()}</b>
                    <span className="text-[#9BA6BC]"> ({path?.solved ?? 0}/{path?.total ?? 0})</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* search & section header */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[11px] font-semibold tracking-[0.25em] text-[#C6CCDA]">
            GLOBAL RANKINGS
          </div>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a team name…"
              className="bg-[#0B0E16] border border-[#1E2536] text-[12px] text-[#F2F5FA] focus:outline-none focus:border-[#5ED6E3] placeholder-[#8B93A9] px-3 py-1.5 w-full sm:w-64 transition-colors font-mono"
            />
          </div>
        </div>

        {/* top three */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scoreboard.slice(0, 3).map((t, i) => (
            <div
              key={t.teamId}
              className="border border-[#1E2536] bg-[#0B0E16]/60 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[26px]" style={{ color: medal[i] }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {t.isMe && (
                  <span
                    className="text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 bg-[#5ED6E3] text-[#07090F]"
                  >
                    YOU
                  </span>
                )}
              </div>
              <div className="mt-1 text-[14px] font-semibold tracking-[0.06em] text-[#F2F5FA] truncate">{t.name}</div>
              <div className="mt-1.5 text-[11px] text-[#A6B2C8] font-medium">{t.solves} SOLVES</div>
              <div className="mt-3 pt-3 border-t border-[#1E2536] flex items-end justify-end">
                <span className="font-display text-[22px]" style={{ color: medal[i] }}>
                  {t.points.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 border border-[#1E2536] bg-[#0B0E16]/60 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[11px] tracking-[0.25em] text-[#C6CCDA] bg-[#07090F]">
                  <th className="py-3.5 px-4 font-bold">RANK</th>
                  <th className="py-3.5 px-4 font-bold">CELL / TEAM</th>
                  <th className="py-3.5 px-4 text-center font-bold">SOLVES</th>
                  <th className="py-3.5 px-4 text-right font-bold">SCORE</th>
                  <th className="py-3.5 px-4 text-right font-bold hidden md:table-cell">LAST SOLVE</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr
                    key={t.teamId}
                    className={`border-b border-[#141A2B] transition-colors ${
                      t.isMe
                        ? 'bg-[#5ED6E3]/15 border-y-2 border-[#5ED6E3] shadow-[0_0_15px_rgba(94,214,227,0.15)]'
                        : 'hover:bg-[#0E1320]/60'
                    }`}
                    style={t.isMe ? { boxShadow: 'inset 3px 0 0 #5ED6E3' } : {}}
                  >
                    <td className={`py-3.5 px-4 font-mono ${t.isMe ? 'text-[#5ED6E3] font-bold text-[13px]' : 'text-[#8B93A9]'}`}>
                      #{t.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={t.isMe ? 'text-[#F2F5FA] font-bold text-[13.5px]' : 'text-[#D5DBE7] font-medium'}>
                          {t.name}
                        </span>
                        {t.isMe && (
                          <span className="text-[9px] font-mono tracking-widest bg-[#5ED6E3] text-[#07090F] font-bold px-1.5 py-0.5 rounded-[1px]">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 text-center font-mono ${t.isMe ? 'text-[#5ED6E3] font-semibold' : 'text-[#A6B2C8]'}`}>
                      {t.solves}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${t.isMe ? 'text-[#5ED6E3] text-[14px]' : 'text-[#F2F5FA]'}`}>
                      {t.points.toLocaleString()} PTS
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#8B93A9] text-[11px] font-mono hidden md:table-cell">
                      {relativeTime(t.lastSubmission)}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-[#8B93A9]">
                      {scoreboard.length === 0 ? 'No teams have scored yet.' : 'No team matches that name.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4">
              <div className="text-[12px] font-semibold tracking-[0.1em] text-[#F2F5FA]">NOT DONE DIGGING?</div>
              <p className="mt-1 text-[11px] text-[#A6B2C8]">Unopened seals are still down there.</p>
              <button
                onClick={() => navigateTo('DASHBOARD')}
                className="mt-3 w-full py-2.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[11px] font-bold tracking-[0.2em] transition-colors cursor-pointer"
              >
                BACK TO CHALLENGES →
              </button>
            </div>
            <div className="border border-[#1E2536] bg-[#0B0E16]/60 p-4 text-[10.5px] leading-relaxed tracking-[0.12em] text-[#A6B2C8]">
              Challenge scores decay as more teams solve them, so early solves earn more points.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
