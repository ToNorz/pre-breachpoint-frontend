import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { api, ApiScoreboardEntry } from '../../services/api';
import { AdminTeamInfo } from '../../types';
import { AdminNav } from './AdminNav';

interface MergedLeaderboardEntry {
  rank: number | null;
  teamId: string;
  name: string;
  score: number;
  solves: number;
  lastSolveAt: string | null;
  memberCount: number;
  joinCode: string;
}

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

const MEDAL_COLORS = ['#E0A83E', '#5ED6E3', '#E84D7E'];

export const AdminLeaderboard: React.FC = () => {
  const { notify } = useGame();
  const [entries, setEntries] = useState<MergedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'top10' | 'top25'>('all');

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [sb, teams] = await Promise.all([
        api.scoreboard().catch(() => ({ entries: [] as ApiScoreboardEntry[] })),
        api.adminListTeams().catch(() => [] as AdminTeamInfo[]),
      ]);

      const teamMap = new Map<string, AdminTeamInfo>();
      teams.forEach((t) => teamMap.set(t.id, t));

      const merged: MergedLeaderboardEntry[] = [];
      const seenIds = new Set<string>();

      sb.entries.forEach((entry) => {
        const team = teamMap.get(entry.teamId);
        seenIds.add(entry.teamId);
        const solves = Number(entry.solveCount ?? 0);
        merged.push({
          rank: entry.rank,
          teamId: entry.teamId,
          name: entry.displayName || team?.name || 'Unnamed Cell',
          score: Number(entry.score) || 0,
          solves,
          lastSolveAt: entry.lastSolveAt,
          memberCount: team?.members?.length ?? 0,
          joinCode: team?.joinCode ?? '—',
        });
      });

      teams.forEach((team) => {
        if (!seenIds.has(team.id)) {
          merged.push({
            rank: null,
            teamId: team.id,
            name: team.name,
            score: Number(team.score) || 0,
            solves: Number(team.solveCount ?? 0),
            lastSolveAt: null,
            memberCount: team.members?.length ?? 0,
            joinCode: team.joinCode,
          });
        }
      });

      merged.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.solves !== a.solves) return b.solves - a.solves;
        if (a.lastSolveAt && b.lastSolveAt) {
          return new Date(a.lastSolveAt).getTime() - new Date(b.lastSolveAt).getTime();
        }
        if (a.lastSolveAt) return -1;
        if (b.lastSolveAt) return 1;
        return a.name.localeCompare(b.name);
      });

      merged.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      setEntries(merged);
    } catch {
      notify('error', 'LOAD FAILED', 'Could not refresh live leaderboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void loadData(true);
    }, 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Rank', 'Team Name', 'Score', 'Solves', 'Last Solve', 'Members', 'Join Code'];
    const rows = entries.map((e) => [
      e.rank ?? '—',
      `"${e.name.replace(/"/g, '""')}"`,
      e.score,
      e.solves,
      e.lastSolveAt ? new Date(e.lastSolveAt).toISOString() : 'None',
      e.memberCount,
      e.joinCode,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leaderboard_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = e.name.toLowerCase().includes(q);
        const matchCode = e.joinCode.toLowerCase().includes(q);
        const matchRank = String(e.rank).includes(q);
        if (!matchName && !matchCode && !matchRank) return false;
      }
      if (filterType === 'top10' && (e.rank === null || e.rank > 10)) return false;
      if (filterType === 'top25' && (e.rank === null || e.rank > 25)) return false;
      return true;
    });
  }, [entries, search, filterType]);

  const leader = entries[0] ?? null;
  const maxScore = leader?.score || 1;

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E] font-semibold">
              ■ COMMAND ARCHIVE // REAL-TIME STANDINGS
            </div>
            <h1 className="mt-1 font-display text-2xl tracking-wide text-[#F2F5FA] flex items-center gap-3">
              LIVE LEADERBOARD
            </h1>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-[#5A6379]">
              <span>{entries.length} cells registered</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-[#5ED6E3] animate-pulse shadow-[0_0_8px_#5ED6E3]' : 'bg-[#5A6379]'}`} />
                <span className={autoRefresh ? 'text-[#5ED6E3]' : 'text-[#5A6379]'}>
                  {autoRefresh ? 'LIVE POLLING ACTIVE (10s)' : 'POLLING PAUSED'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 border text-[10px] tracking-[0.15em] font-semibold cursor-pointer transition-colors ${
                autoRefresh
                  ? 'border-[#5ED6E3]/50 text-[#5ED6E3] bg-[#5ED6E3]/10'
                  : 'border-[#1E2536] text-[#8B93A9] hover:text-[#D5DBE7]'
              }`}
            >
              AUTO-REFRESH: {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="px-3 py-2 border border-[#1E2536] text-[10px] tracking-[0.18em] text-[#D5DBE7] hover:border-[#5ED6E3] cursor-pointer disabled:opacity-40"
            >
              {refreshing ? 'REFRESHING…' : 'REFRESH NOW ↻'}
            </button>

            <button
              onClick={exportCSV}
              disabled={entries.length === 0}
              className="px-3 py-2 border border-[#1E2536] text-[10px] tracking-[0.18em] text-[#8B93A9] hover:text-[#D5DBE7] cursor-pointer disabled:opacity-40"
            >
              EXPORT CSV ↓
            </button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-6">
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E] font-bold mb-3 flex items-center justify-between">
              <span>■ PODIUM // TOP THREE OPERATIVE CELLS</span>
              <span className="text-[10px] text-[#5A6379] font-mono">REAL-TIME RANKINGS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {entries.slice(0, 3).map((t, idx) => {
                const color = MEDAL_COLORS[idx];
                const placeNumber = idx + 1;
                const medalLabel = idx === 0 ? 'GOLD // 1ST PLACE' : idx === 1 ? 'SILVER // 2ND PLACE' : 'BRONZE // 3RD PLACE';
                return (
                  <div
                    key={t.teamId}
                    className="border p-5 bg-[#0B0E16]/90 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ borderColor: `${color}60` }}
                  >
                    <div
                      className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-15"
                      style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.25em] font-bold" style={{ color }}>
                        {medalLabel}
                      </span>
                      <span
                        className="text-[13px] font-mono font-bold px-2.5 py-0.5 rounded border"
                        style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
                      >
                        #{placeNumber}
                      </span>
                    </div>
                    <div className="mt-3 font-display text-xl font-bold text-[#F2F5FA] truncate" title={t.name}>
                      {t.name}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold" style={{ color }}>
                        {t.score.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-mono text-[#8B93A9]">PTS</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#1E2536]/80 flex items-center justify-between text-[10.5px] text-[#8B93A9] font-mono">
                      <span>Solves: <strong className="text-[#D5DBE7]">{t.solves}</strong></span>
                      <span>Last: <strong className="text-[#D5DBE7]">{relativeTime(t.lastSolveAt)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 bg-[#0B0E16] border border-[#1E2536] p-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] tracking-[0.25em] text-[#5A6379] mr-1">FILTER:</span>
            {(['all', 'top10', 'top25'] as const).map((f) => {
              const label =
                f === 'all' ? 'ALL CELLS' : f === 'top10' ? 'TOP 10' : 'TOP 25';
              return (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1 text-[10px] tracking-[0.15em] font-bold transition-all cursor-pointer rounded border ${
                    filterType === f
                      ? 'bg-[#5ED6E3]/20 text-[#5ED6E3] border-[#5ED6E3]'
                      : 'bg-transparent text-[#5A6379] border-transparent hover:text-[#8B93A9]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by cell name, rank, or join code..."
              className="w-full bg-[#07090F] border border-[#1E2536] px-3 py-1.5 text-[11px] text-[#D5DBE7] placeholder-[#454C61] focus:border-[#5ED6E3] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1.5 text-[11px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-[11px] tracking-[0.3em] text-[#5A6379] py-12">
            SCANNING TELEMETRY & STANDINGS…
          </div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/60">
                  <th className="px-4 py-3 text-left w-16">RANK</th>
                  <th className="px-4 py-3 text-left">CELL / TEAM NAME</th>
                  <th className="px-4 py-3 text-right">SCORE</th>
                  <th className="px-3 py-3 text-center">SOLVES</th>
                  <th className="px-4 py-3 text-left">LAST SOLVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2536]/50">
                {filtered.map((entry) => {
                  const isTop3 = entry.rank !== null && entry.rank <= 3;
                  const rankColor = isTop3 ? MEDAL_COLORS[entry.rank! - 1] : '#8B93A9';
                  const scorePercent = maxScore > 0 ? Math.min(100, Math.max(5, (entry.score / maxScore) * 100)) : 0;

                  return (
                    <tr
                      key={entry.teamId}
                      className="hover:bg-[#5ED6E3]/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] rounded border ${
                            isTop3
                              ? 'border-current font-extrabold'
                              : 'border-transparent text-[#5A6379]'
                          }`}
                          style={{ color: rankColor, backgroundColor: isTop3 ? `${rankColor}15` : undefined }}
                        >
                          #{entry.rank ?? '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-[#F2F5FA] flex items-center gap-2">
                          <span className="text-[13px]">{entry.name}</span>
                        </div>
                        <div className="text-[10px] text-[#5A6379] font-mono mt-0.5 flex items-center gap-3">
                          <span>{entry.memberCount} operative{entry.memberCount === 1 ? '' : 's'}</span>
                          <span>·</span>
                          <span>Join: <strong className="text-[#8B93A9]">{entry.joinCode}</strong></span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-mono text-[14px] font-bold text-[#5ED6E3]">
                          {entry.score.toLocaleString()} <span className="text-[10px] text-[#5A6379]">PTS</span>
                        </div>
                        <div className="w-24 ml-auto h-1 bg-[#1E2536] rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-[#5ED6E3]"
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-semibold text-[#D5DBE7]">
                        {entry.solves}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[11px] text-[#D5DBE7] font-mono">
                          {relativeTime(entry.lastSolveAt)}
                        </div>
                        {entry.lastSolveAt && (
                          <div className="text-[9.5px] text-[#5A6379] font-mono">
                            {new Date(entry.lastSolveAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#5A6379]">
                No competing cells match the specified search or filter criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
