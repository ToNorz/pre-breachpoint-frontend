import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { AdminSubmissionLog } from '../../types';
import { AdminNav } from './AdminNav';

export const AdminActivity: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [submissions, setSubmissions] = useState<AdminSubmissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!adminEvent) return;
    try {
      const data = await api.adminListSubmissions(adminEvent.id, 100);
      setSubmissions(data);
    } catch (err: unknown) {
      notify('error', 'LOAD FAILED', err instanceof Error ? err.message : 'Could not fetch submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [adminEvent]);

  // Periodic polling for live monitor
  useEffect(() => {
    if (!autoRefresh || !adminEvent) return;
    const interval = setInterval(() => {
      void load();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, adminEvent]);

  const filtered = submissions.filter((s) => {
    if (filter === 'correct' && s.verdict !== 'correct') return false;
    if (filter === 'incorrect' && s.verdict === 'correct') return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.teamName.toLowerCase().includes(q) ||
      s.challengeTitle.toLowerCase().includes(q) ||
      s.flag.toLowerCase().includes(q)
    );
  });

  const correctCount = submissions.filter((s) => s.verdict === 'correct').length;
  const incorrectCount = submissions.filter((s) => s.verdict !== 'correct').length;

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ LIVE TELEMETRY</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">
              SUBMISSION AUDIT STREAM {adminEvent ? `— ${adminEvent.name}` : ''}
            </h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              Showing last {submissions.length} attempts · {correctCount} correct · {incorrectCount} incorrect
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.15em] border cursor-pointer ${
                autoRefresh
                  ? 'border-[#5ED6E3] text-[#5ED6E3] bg-[#5ED6E3]/[0.08] shadow-[0_0_12px_rgba(94,214,227,0.3)]'
                  : 'border-[#1E2536] text-[#5A6379]'
              }`}
            >
              {autoRefresh ? 'LIVE (5s) ◉' : 'LIVE PAUSED ○'}
            </button>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="px-4 py-1.5 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06] cursor-pointer disabled:opacity-40"
            >
              REFRESH
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {(['all', 'correct', 'incorrect'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.18em] cursor-pointer ${
                  filter === mode
                    ? 'text-[#E0A83E] border-b border-[#E0A83E]'
                    : 'text-[#5A6379] hover:text-[#8B93A9]'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter cell, challenge, or flag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0E1220] border border-[#1E2536] px-3 py-1.5 text-[11px] text-[#D5DBE7] placeholder-[#5A6379] outline-none focus:border-[#5ED6E3] w-64 pr-7"
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

        {loading ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#5A6379]">STREAMING AUDIT LOGS…</div>
        ) : !adminEvent ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#E84D7E]">NO EVENT SELECTED</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 border border-[#1E2536] p-8 text-center text-[#5A6379] text-[12px]">
            {search || filter !== 'all'
              ? 'No submissions matching current filter.'
              : 'No submissions recorded yet for this event.'}
          </div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/50">
                  <th className="px-4 py-2.5">TIMESTAMP</th>
                  <th className="px-4 py-2.5">CELL</th>
                  <th className="px-4 py-2.5">CHALLENGE</th>
                  <th className="px-4 py-2.5">FLAG SUBMITTED</th>
                  <th className="px-4 py-2.5 text-right">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2536]/40">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#5ED6E3]/[0.02]">
                    <td className="px-4 py-2.5 text-[#5A6379] whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#D5DBE7] whitespace-nowrap">
                      {sub.teamName}
                    </td>
                    <td className="px-4 py-2.5 text-[#8B93A9] max-w-[200px] truncate">
                      {sub.challengeTitle}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-[#D5DBE7] max-w-[260px] truncate">
                      <span className="bg-[#0E1220] px-2 py-0.5 border border-[#1E2536]">
                        {sub.flag}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {sub.verdict === 'correct' ? (
                        <span className="text-[10px] font-bold text-[#5ED6E3] border border-[#5ED6E3]/40 px-2 py-0.5 bg-[#5ED6E3]/[0.08]">
                          SOLVE ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#E84D7E] border border-[#E84D7E]/40 px-2 py-0.5 bg-[#E84D7E]/[0.08]">
                          {sub.verdict.toUpperCase()} ✗
                        </span>
                      )}
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
