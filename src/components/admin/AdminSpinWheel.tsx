import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminSpinWheelResponse, AdminSpinWheelLogItem } from '../../services/api';
import { AdminNav } from './AdminNav';

const PROBABILITY_META: Record<string, { category: string; color: string; desc: string }> = {
  GAME_1: { category: 'High Chance', color: '#5ED6E3', desc: 'Side-Operation Protocol Alpha' },
  BETTER_LUCK: { category: 'Low Chance', color: '#8B93A9', desc: 'Quantum Signal Disrupted' },
  GAME_2: { category: 'High Chance', color: '#A78BFA', desc: 'Side-Operation Protocol Beta' },
  FREE_HINT: { category: 'Low Chance', color: '#E0A83E', desc: '0-Cost Intel Decryption' },
  GAME_3: { category: 'High Chance', color: '#34D399', desc: 'Side-Operation Protocol Gamma' },
  FREE_SPIN: { category: 'Moderate (< Games)', color: '#F43F5E', desc: 'Quota Preserved (+1 Spin)' },
};

const DEFAULT_PROBABILITIES = [
  { segment: 'GAME_1', label: 'GAME-1', prob: '24%', category: 'High Chance', color: '#5ED6E3', desc: 'Side-Operation Protocol Alpha' },
  { segment: 'BETTER_LUCK', label: 'BETTER LUCK', prob: '7%', category: 'Low Chance', color: '#8B93A9', desc: 'Quantum Signal Disrupted' },
  { segment: 'GAME_2', label: 'GAME-2', prob: '24%', category: 'High Chance', color: '#A78BFA', desc: 'Side-Operation Protocol Beta' },
  { segment: 'FREE_HINT', label: 'FREE HINT', prob: '7%', category: 'Low Chance', color: '#E0A83E', desc: '0-Cost Intel Decryption' },
  { segment: 'GAME_3', label: 'GAME-3', prob: '24%', category: 'High Chance', color: '#34D399', desc: 'Side-Operation Protocol Gamma' },
  { segment: 'FREE_SPIN', label: 'FREE SPIN', prob: '14%', category: 'Moderate (< Games)', color: '#F43F5E', desc: 'Quota Preserved (+1 Spin)' },
];

export const AdminSpinWheel: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [data, setData] = useState<AdminSpinWheelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'games' | 'hints' | 'spins' | 'miss'>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    if (!adminEvent) return;
    try {
      const res = await api.adminGetSpinWheelLogs(adminEvent.id);
      setData(res);
    } catch (err: unknown) {
      notify('error', 'LOAD FAILED', err instanceof Error ? err.message : 'Could not fetch spin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [adminEvent]);

  // Periodic polling for live monitor
  useEffect(() => {
    if (!autoRefresh || !adminEvent) return;
    const interval = setInterval(() => {
      void loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, adminEvent]);

  const allLogs: AdminSpinWheelLogItem[] = data?.logs ?? [];

  const displayProbabilities = data?.probabilities?.length
    ? data.probabilities.map((p) => ({
        segment: p.segment,
        label: p.label.toUpperCase(),
        prob: p.probability,
        category: PROBABILITY_META[p.segment]?.category ?? 'Standard',
        color: PROBABILITY_META[p.segment]?.color ?? '#5ED6E3',
        desc: PROBABILITY_META[p.segment]?.desc ?? '',
      }))
    : DEFAULT_PROBABILITIES;

  const filtered = allLogs.filter((item) => {
    if (filter === 'games' && !item.segment.startsWith('GAME_')) return false;
    if (filter === 'hints' && item.segment !== 'FREE_HINT') return false;
    if (filter === 'spins' && item.segment !== 'FREE_SPIN') return false;
    if (filter === 'miss' && item.segment !== 'BETTER_LUCK') return false;

    const q = search.toLowerCase().trim();
    if (!q) return true;

    const awardedStr = item.awardedData ? JSON.stringify(item.awardedData).toLowerCase() : '';
    return (
      item.teamName.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      item.challengeTitle.toLowerCase().includes(q) ||
      item.segment.toLowerCase().includes(q) ||
      awardedStr.includes(q)
    );
  });

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'GAME_1':
        return (
          <span className="text-[10px] font-bold text-[#5ED6E3] border border-[#5ED6E3]/40 px-2 py-0.5 bg-[#5ED6E3]/[0.08] font-mono">
            GAME-1
          </span>
        );
      case 'GAME_2':
        return (
          <span className="text-[10px] font-bold text-[#A78BFA] border border-[#A78BFA]/40 px-2 py-0.5 bg-[#A78BFA]/[0.08] font-mono">
            GAME-2
          </span>
        );
      case 'GAME_3':
        return (
          <span className="text-[10px] font-bold text-[#34D399] border border-[#34D399]/40 px-2 py-0.5 bg-[#34D399]/[0.08] font-mono">
            GAME-3
          </span>
        );
      case 'FREE_HINT':
        return (
          <span className="text-[10px] font-bold text-[#E0A83E] border border-[#E0A83E]/40 px-2 py-0.5 bg-[#E0A83E]/[0.08] font-mono">
            FREE HINT
          </span>
        );
      case 'FREE_SPIN':
        return (
          <span className="text-[10px] font-bold text-[#F43F5E] border border-[#F43F5E]/40 px-2 py-0.5 bg-[#F43F5E]/[0.08] font-mono">
            FREE SPIN
          </span>
        );
      case 'BETTER_LUCK':
      default:
        return (
          <span className="text-[10px] font-bold text-[#8B93A9] border border-[#8B93A9]/40 px-2 py-0.5 bg-[#8B93A9]/[0.08] font-mono">
            BETTER LUCK
          </span>
        );
    }
  };

  const renderRewardDetail = (item: AdminSpinWheelLogItem) => {
    const d = item.awardedData as Record<string, unknown> | null;
    if (!d) {
      if (item.segment === 'BETTER_LUCK') {
        return <span className="text-[#5A6379] italic text-[10px]">No reward (signal disrupted)</span>;
      }
      return <span className="text-[#5A6379] text-[10px]">Standard protocol</span>;
    }

    if (item.segment === 'FREE_HINT') {
      return (
        <div className="space-y-1">
          <div className="text-[#E0A83E] font-semibold text-[11px] flex items-center gap-1">
            <span>[0-Cost Hint Decrypted]</span>
            {typeof d.hintCostSaved === 'number' && (
              <span className="text-[9px] px-1 bg-[#E0A83E]/20 border border-[#E0A83E]/40">
                +{d.hintCostSaved} pts saved
              </span>
            )}
          </div>
          {typeof d.hintBody === 'string' && (
            <div className="text-[10px] text-[#D5DBE7] font-mono bg-[#07090F] p-1.5 border border-[#1E2536] max-w-md truncate">
              "{d.hintBody}"
            </div>
          )}
          {typeof d.message === 'string' && !d.hintBody && (
            <div className="text-[10px] text-[#8B93A9]">{d.message}</div>
          )}
        </div>
      );
    }

    if (item.segment === 'FREE_SPIN') {
      return (
        <div className="text-[#F43F5E] text-[11px] font-mono">
          <span>[Quota Preserved (+1 Spin)]</span>
        </div>
      );
    }

    if (item.segment.startsWith('GAME_')) {
      return (
        <div className="space-y-0.5">
          <div className="text-[#5ED6E3] font-mono text-[11px]">
            {typeof d.title === 'string' ? d.title : `Side-Game Link: ${item.segment}`}
          </div>
          {typeof d.message === 'string' && (
            <div className="text-[#8B93A9] text-[10px] truncate max-w-sm">{d.message}</div>
          )}
        </div>
      );
    }

    return <div className="text-[#8B93A9] text-[10px]">{typeof d.message === 'string' ? d.message : '—'}</div>;
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        {/* Header section */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ QUANTUM TELEMETRY AUDIT</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">
              SPIN WHEEL AUDIT & REWARDS MONITOR {adminEvent ? `— ${adminEvent.name}` : ''}
            </h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              Real-time audit of team spins, remaining allowances, challenge ties, and unlocked rewards.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.15em] border cursor-pointer font-mono ${
                autoRefresh
                  ? 'border-[#5ED6E3] text-[#5ED6E3] bg-[#5ED6E3]/[0.08] shadow-[0_0_12px_rgba(94,214,227,0.3)]'
                  : 'border-[#1E2536] text-[#5A6379]'
              }`}
            >
              {autoRefresh ? 'LIVE (5s) ◉' : 'LIVE PAUSED ○'}
            </button>
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="px-4 py-1.5 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06] cursor-pointer disabled:opacity-40 font-mono"
            >
              REFRESH
            </button>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
            <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">TOTAL SPINS</div>
            <div className="mt-1 text-[19px] font-bold tracking-[0.08em] text-[#F2F5FA] font-mono">
              {data?.stats.totalSpins ?? 0}
            </div>
            <div className="mt-1 text-[10px] text-[#5A6379]">All attempts executed</div>
          </div>
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
            <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">FREE HINTS WON</div>
            <div className="mt-1 text-[19px] font-bold tracking-[0.08em] text-[#E0A83E] font-mono">
              {data?.stats.totalFreeHints ?? 0}
            </div>
            <div className="mt-1 text-[10px] text-[#5A6379]">0-cost intel decryptions</div>
          </div>
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
            <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">FREE SPINS WON</div>
            <div className="mt-1 text-[19px] font-bold tracking-[0.08em] text-[#F43F5E] font-mono">
              {data?.stats.totalFreeSpins ?? 0}
            </div>
            <div className="mt-1 text-[10px] text-[#5A6379]">Quota preserved</div>
          </div>
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
            <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">ACTIVE CELLS</div>
            <div className="mt-1 text-[19px] font-bold tracking-[0.08em] text-[#5ED6E3] font-mono">
              {data?.stats.activeTeamsCount ?? 0}
            </div>
            <div className="mt-1 text-[10px] text-[#5A6379]">Participating teams</div>
          </div>
          <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
            <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">CELL QUOTA</div>
            <div className="mt-1 text-[19px] font-bold tracking-[0.08em] text-[#A78BFA] font-mono">
              {data?.totalQuota ?? 10}
            </div>
            <div className="mt-1 text-[10px] text-[#5A6379]">Spins max per cell</div>
          </div>
        </div>

        {/* Quantum Probability Breakdown Matrix Card */}
        <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/70 p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#1E2536]">
            <div>
              <div className="text-[10px] tracking-[0.25em] text-[#E0A83E] font-mono font-bold">
                ■ QUANTUM PROBABILITY DISTRIBUTION MATRIX
              </div>
              <div className="text-[11px] text-[#8B93A9] mt-0.5">
                Calibrated sector probabilities enforced by the server rotor algorithm.
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#5ED6E3] bg-[#5ED6E3]/10 px-2.5 py-1 border border-[#5ED6E3]/30">
              GAMES: 72% · BETTER LUCK: 14% · SPECIALS: 14%
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {displayProbabilities.map((p) => (
              <div
                key={p.segment}
                className="border border-[#1E2536] bg-[#07090F] p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono" style={{ color: p.color }}>
                      {p.label}
                    </span>
                    <span className="text-[12px] font-bold font-mono text-[#F2F5FA]">{p.prob}</span>
                  </div>
                  <div className="mt-1 text-[9px] text-[#5A6379] font-mono">{p.category}</div>
                  <div className="mt-1 text-[10px] text-[#8B93A9]">{p.desc}</div>
                </div>
                <div className="mt-3 w-full bg-[#141824] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: p.prob,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'ALL OUTCOMES' },
              { id: 'games', label: 'GAMES (1-3)' },
              { id: 'hints', label: 'FREE HINTS' },
              { id: 'spins', label: 'FREE SPINS' },
              { id: 'miss', label: 'BETTER LUCK' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as typeof filter)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.18em] cursor-pointer font-mono transition-colors ${
                  filter === t.id
                    ? 'text-[#E0A83E] border-b-2 border-[#E0A83E] font-bold'
                    : 'text-[#5A6379] hover:text-[#8B93A9]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search cell, operative, challenge, or reward…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0E1220] border border-[#1E2536] px-3 py-1.5 text-[11px] text-[#D5DBE7] placeholder-[#5A6379] outline-none focus:border-[#5ED6E3] w-64 font-mono pr-7"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5A6379] hover:text-[#F2F5FA] text-[12px] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Audit Stream Table */}
        {loading ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#5A6379] font-mono">
            STREAMING SPIN TELEMETRY…
          </div>
        ) : !adminEvent ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#E84D7E] font-mono">
            NO EVENT SELECTED
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 border border-[#1E2536] p-8 text-center text-[#5A6379] text-[12px] font-mono">
            {search || filter !== 'all'
              ? 'No spin logs matching the current filter.'
              : 'No spins recorded yet for this event.'}
          </div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto bg-[#0A0D15]/80">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/70 font-mono">
                  <th className="px-4 py-3">TIMESTAMP</th>
                  <th className="px-4 py-3">CELL & OPERATIVE</th>
                  <th className="px-4 py-3">TARGET CHALLENGE</th>
                  <th className="px-4 py-3">RESULT SEGMENT</th>
                  <th className="px-4 py-3">REWARD / DIRECTIVE DETAILS</th>
                  <th className="px-4 py-3 text-right">SPINS REMAINING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2536]/40">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[#5ED6E3]/[0.02] transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-[#5A6379] whitespace-nowrap font-mono">
                      <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[9px] text-[#424B5F]">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Cell & Operative */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#D5DBE7] font-mono">{log.teamName}</div>
                      <div className="text-[10px] text-[#5ED6E3] font-mono">@{log.username}</div>
                    </td>

                    {/* Target Challenge */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-[#F2F5FA] truncate font-mono text-[11px]">
                        {log.challengeTitle || '—'}
                      </div>
                      <div className="text-[9px] text-[#5A6379] font-mono truncate">
                        ID: {log.challengeId.slice(0, 8)}…
                      </div>
                    </td>

                    {/* Result Segment */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSegmentBadge(log.segment)}
                      {log.isFreeSpin && (
                        <div className="text-[9px] text-[#F43F5E] font-mono mt-0.5">
                          QUOTA NOT CONSUMED
                        </div>
                      )}
                    </td>

                    {/* Reward Details */}
                    <td className="px-4 py-3 max-w-[260px]">{renderRewardDetail(log)}</td>

                    {/* Spins Used & Remaining */}
                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`font-bold text-[12px] ${
                            log.spinsRemaining <= 2
                              ? 'text-[#E84D7E]'
                              : log.spinsRemaining <= 5
                              ? 'text-[#E0A83E]'
                              : 'text-[#5ED6E3]'
                          }`}
                        >
                          {log.spinsRemaining} / {log.totalQuota}
                        </span>
                        <span className="text-[9px] text-[#5A6379]">LEFT</span>
                      </div>
                      <div className="mt-1 w-20 ml-auto bg-[#141824] h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${(log.spinsRemaining / log.totalQuota) * 100}%`,
                            backgroundColor:
                              log.spinsRemaining <= 2
                                ? '#E84D7E'
                                : log.spinsRemaining <= 5
                                ? '#E0A83E'
                                : '#5ED6E3',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
