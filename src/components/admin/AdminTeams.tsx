import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { AdminTeamInfo } from '../../types';
import { AdminNav } from './AdminNav';

export const AdminTeams: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [teams, setTeams] = useState<AdminTeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = async () => {
    if (!adminEvent) return;
    setLoading(true);
    try {
      const data = await api.adminListTeams(adminEvent.id);
      setTeams(data);
    } catch (err: unknown) {
      notify('error', 'LOAD FAILED', err instanceof Error ? err.message : 'Could not fetch teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [adminEvent]);

  const toggleBan = async (team: AdminTeamInfo) => {
    if (!adminEvent) return;
    setActionBusy(true);
    try {
      await api.adminPatchTeam(adminEvent.id, team.id, { banned: !team.banned });
      notify(
        'success',
        team.banned ? 'TEAM UNBANNED' : 'TEAM BANNED',
        `"${team.name}" status updated.`,
      );
      void load();
    } catch (err: unknown) {
      notify('error', 'ACTION FAILED', err instanceof Error ? err.message : 'Could not update team.');
    } finally {
      setActionBusy(false);
    }
  };

  const removeTeam = async (teamId: string) => {
    if (!adminEvent) return;
    setActionBusy(true);
    try {
      await api.adminDeleteTeam(adminEvent.id, teamId);
      notify('success', 'TEAM REMOVED', 'Team and its progress have been deleted.');
      setConfirmDeleteId(null);
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Could not delete team.');
    } finally {
      setActionBusy(false);
    }
  };

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.joinCode.toLowerCase().includes(q) ||
      t.members.some((m) => m.username.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ TEAM & ROSTER MANAGER</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">
              REGISTERED TEAMS {adminEvent ? `— ${adminEvent.name}` : ''}
            </h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              {teams.length} total cells · {teams.filter((t) => t.banned).length} banned
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams or operatives…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[11px] text-[#D5DBE7] placeholder-[#5A6379] outline-none focus:border-[#5ED6E3] w-64 pr-7"
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
            <button
              onClick={() => void load()}
              disabled={loading}
              className="px-4 py-2 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06] cursor-pointer disabled:opacity-40"
            >
              REFRESH
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING TEAMS…</div>
        ) : !adminEvent ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#E84D7E]">NO EVENT SELECTED</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 border border-[#1E2536] p-8 text-center text-[#5A6379] text-[12px]">
            {search ? 'No teams matching search query.' : 'No teams have registered for this event yet.'}
          </div>
        ) : (
          <div className="mt-6 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/50">
                  <th className="px-4 py-3">CELL NAME</th>
                  <th className="px-4 py-3">JOIN CODE</th>
                  <th className="px-4 py-3">MEMBERS</th>
                  <th className="px-4 py-3 text-right">SCORE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2536]/50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[#5ED6E3]/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#F2F5FA]">{t.name}</div>
                      <div className="text-[10px] text-[#5A6379]">
                        Created {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 border border-[#1E2536] bg-[#0E1220] text-[#5ED6E3]">
                        {t.joinCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {t.members.length === 0 ? (
                          <span className="text-[#5A6379] text-[11px]">No operatives</span>
                        ) : (
                          t.members.map((m) => (
                            <span
                              key={m.userId}
                              className={`text-[10px] px-2 py-0.5 border ${
                                m.role === 'captain'
                                  ? 'border-[#E0A83E]/40 text-[#E0A83E] bg-[#E0A83E]/[0.05]'
                                  : 'border-[#1E2536] text-[#8B93A9]'
                              }`}
                              title={m.role === 'captain' ? 'Cell Captain' : 'Operative'}
                            >
                              {m.role === 'captain' ? '★ ' : ''}
                              {m.username}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#5ED6E3]">
                      {t.score.toLocaleString()} PTS
                    </td>
                    <td className="px-4 py-3">
                      {t.banned ? (
                        <span className="text-[10px] font-bold text-[#E84D7E] border border-[#E84D7E]/40 px-2 py-0.5 bg-[#E84D7E]/[0.08]">
                          BANNED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#5ED6E3] border border-[#5ED6E3]/40 px-2 py-0.5 bg-[#5ED6E3]/[0.05]">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void toggleBan(t)}
                          disabled={actionBusy}
                          className={`text-[10px] tracking-[0.15em] px-2.5 py-1 border cursor-pointer ${
                            t.banned
                              ? 'border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10'
                              : 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/10'
                          }`}
                        >
                          {t.banned ? 'UNBAN' : 'BAN'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          disabled={actionBusy}
                          className="text-[10px] tracking-[0.15em] px-2.5 py-1 border border-[#E84D7E]/40 text-[#E84D7E] hover:bg-[#E84D7E]/20 cursor-pointer"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full border border-[#E84D7E]/60 bg-[#0B0E16] p-6 text-left">
              <div className="text-[10px] tracking-[0.3em] text-[#E84D7E]">WARNING — DESTRUCTIVE ACTION</div>
              <h3 className="mt-2 font-display text-lg text-[#F2F5FA]">
                Delete Team "{teams.find((t) => t.id === confirmDeleteId)?.name}"?
              </h3>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed">
                This will permanently delete this cell, remove all operatives from the team, and delete all of
                their recorded submissions, solves, and hints for this event.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-[11px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => void removeTeam(confirmDeleteId)}
                  disabled={actionBusy}
                  className="px-5 py-2 bg-[#E84D7E] text-white text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40"
                >
                  {actionBusy ? 'DELETING…' : 'CONFIRM DELETE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
