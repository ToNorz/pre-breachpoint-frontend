import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const TeamView: React.FC = () => {
  const { currentUser, team, refresh, board } = useGame();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleCopyCode = async () => {
    if (!team?.joinCode) return;
    try {
      await navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const rawMembers = team?.members || [];

  const resolveMemberName = (m: { displayName?: string | null; username?: string; userId?: string }) => {
    if (m.displayName && m.displayName.trim().length > 0) return m.displayName;
    if (m.username && m.username.trim().length > 0) return m.username;
    if (m.userId === currentUser?.id && currentUser?.username) return currentUser.username;
    return m.userId ? `OPERATIVE_${m.userId.slice(0, 4).toUpperCase()}` : 'OPERATIVE';
  };

  const members = rawMembers.length > 0
    ? rawMembers.map((m: any) => ({
        id: m.userId,
        name: resolveMemberName(m),
        isLeader: m.role === 'captain',
        isCurrent: m.userId === currentUser?.id,
        roleTitle: m.role === 'captain' ? '★ CELL CAPTAIN' : 'OPERATIVE',
      }))
    : [
        {
          id: currentUser?.id ?? 'me',
          name: currentUser?.displayName || currentUser?.username || 'OPERATIVE',
          isLeader: team?.myRole === 'captain' || true,
          isCurrent: true,
          roleTitle: team?.myRole === 'captain' ? '★ CELL CAPTAIN' : 'OPERATIVE',
        },
      ];

  const leader = members.find((m: any) => m.isLeader) || members[0];

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-3xl px-4 sm:px-6 py-8 text-left">
        <div className="flex items-center justify-between">
          <div className="text-[9.5px] tracking-[0.3em] text-[#5ED6E3]">■ TEAM DOSSIER</div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="border border-[#5ED6E3]/40 bg-[#5ED6E3]/10 hover:bg-[#5ED6E3]/20 hover:border-[#5ED6E3] px-3 py-1 text-[10px] tracking-[0.2em] text-[#5ED6E3] hover:text-[#7CE3EE] transition-colors cursor-pointer font-medium"
          >
            {refreshing ? 'SYNCING…' : 'REFRESH ↻'}
          </button>
        </div>

        <h1 className="mt-2 font-display font-medium tracking-wide text-3xl sm:text-4xl text-[#F2F5FA]">
          {team?.name || '—'}
        </h1>

        {team?.joinCode && (
          <div className="mt-6 border border-[#5ED6E3]/30 bg-[#0B1522]/50 p-4 relative">
            <div className="text-[10px] tracking-[0.25em] text-[#5ED6E3]">CELL JOIN CODE</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="font-mono text-2xl font-bold tracking-[0.25em] text-[#F2F5FA] bg-[#07090F] px-4 py-1.5 border border-[#1E2536]">
                {team.joinCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="border border-[#5ED6E3] bg-[#5ED6E3]/10 hover:bg-[#5ED6E3]/20 text-[#5ED6E3] px-4 py-2 text-[11px] tracking-[0.2em] font-medium transition-colors cursor-pointer"
              >
                {copied ? '✓ COPIED' : 'COPY CODE'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#A6B2C8] leading-relaxed">
              Share this join code with your teammates. They can enter it under <span className="text-[#D5DBE7]">JOIN CELL</span> to link into this team.
            </p>
          </div>
        )}

        <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/70 px-5 py-3.5 flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] tracking-[0.25em] text-[#C6CCDA] font-semibold">CELL LEADER</span>
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] tracking-[0.08em] text-[#F2F5FA] font-mono font-bold">
                ★ {leader.name}
              </span>
              {leader.isCurrent && (
                <span className="text-[9px] tracking-[0.2em] bg-[#5ED6E3]/15 text-[#5ED6E3] px-2 py-0.5 border border-[#5ED6E3]/40 font-mono font-bold">
                  YOU
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] tracking-[0.2em] text-[#E0A83E] bg-[#E0A83E]/10 border border-[#E0A83E]/40 px-2.5 py-1 font-semibold inline-flex items-center gap-1.5">
              ★ CELL CAPTAIN
            </span>
          </div>
        </div>

        <div className="mt-5 border border-[#1E2536] bg-[#0B0E16]/40">
          <div className="px-5 py-3 border-b border-[#1E2536] flex items-center justify-between text-[10px] tracking-[0.25em] text-[#C6CCDA] font-semibold bg-[#07090F]/80">
            <span>CELL ROSTER · {members.length} / 4 OPERATIVES</span>
            <span className="text-[9px] text-[#9BA6BC] font-medium tracking-[0.15em]">MAX 4 CELL MEMBERS</span>
          </div>

          <div className="divide-y divide-[#1E2536]/60">
            {members.map((m: any) => (
              <div
                key={m.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-[#0E1320]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[14px] tracking-[0.08em] text-[#F2F5FA] font-mono font-semibold">
                    {m.name}
                  </span>
                  {m.isCurrent && (
                    <span className="text-[9px] tracking-[0.2em] bg-[#5ED6E3]/15 text-[#5ED6E3] px-2 py-0.5 border border-[#5ED6E3]/40 font-mono font-bold">
                      YOU
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {m.isLeader ? (
                    <span className="text-[10px] tracking-[0.2em] text-[#E0A83E] bg-[#E0A83E]/10 border border-[#E0A83E]/40 px-2.5 py-1 font-semibold inline-flex items-center gap-1.5">
                      ★ CELL CAPTAIN
                    </span>
                  ) : (
                    <span className="text-[10px] tracking-[0.2em] text-[#A6B2C8] bg-[#141A28] border border-[#1E2536] px-2.5 py-1 font-medium inline-block">
                      OPERATIVE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-l-2 border-[#3A4358] pl-4 py-1 text-[11px] text-[#A6B2C8] leading-relaxed">
          Points and challenge progress are synchronized in real time across all cell operatives.
        </div>
      </div>
    </div>
  );
};
