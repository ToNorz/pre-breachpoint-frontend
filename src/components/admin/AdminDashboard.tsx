import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, AdminTimeGlitch } from '../../services/api';
import { AdminEventStats } from '../../types';
import { AdminNav } from './AdminNav';

export const AdminDashboard: React.FC = () => {
  const { adminEvent, navigateTo, notify } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [glitches, setGlitches] = useState<AdminTimeGlitch[]>([]);
  const [stats, setStats] = useState<AdminEventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    if (!adminEvent) return;
    setLoading(true);
    try {
      const [c, g, s] = await Promise.all([
        api.adminListChallenges(adminEvent.id).catch(() => []),
        api.adminListGlitches(adminEvent.id).catch(() => []),
        api.adminGetEventStats(adminEvent.id).catch(() => null),
      ]);
      setChallenges(c);
      setGlitches(g);
      setStats(s);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [adminEvent]);

  const togglePublish = async () => {
    if (!adminEvent) return;
    setBusy(true);
    try {
      await api.adminPatchEvent(adminEvent.id, { isPublished: !adminEvent.isPublished });
      notify(
        'success',
        'EVENT STATUS UPDATED',
        adminEvent.isPublished ? 'Event unpublished (Draft).' : 'Event published (Live).',
      );
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async () => {
    if (!adminEvent) return;
    setBusy(true);
    try {
      await api.adminPatchEvent(adminEvent.id, { isFrozen: !adminEvent.isFrozen });
      notify(
        'success',
        'LEADERBOARD UPDATED',
        adminEvent.isFrozen ? 'Board unfrozen.' : 'Board frozen.',
      );
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const setLiveWindow = async (hours: number) => {
    if (!adminEvent) return;
    setBusy(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + hours * 3600 * 1000);
      await api.adminPatchEvent(adminEvent.id, {
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        isPublished: true,
      });
      notify('success', 'WINDOW ACTIVATED', `Event set to Live for ${hours} hours.`);
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const endEventNow = async () => {
    if (!adminEvent) return;
    setBusy(true);
    try {
      const now = new Date();
      await api.adminPatchEvent(adminEvent.id, {
        endsAt: now.toISOString(),
      });
      notify('success', 'EVENT CLOSED', 'Event end time set to now.');
      window.location.reload();
    } catch (e: unknown) {
      notify('error', 'FAILED', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const visible = challenges.filter((c) => c.state === 'visible').length;
  const hidden = challenges.filter((c) => c.state === 'hidden').length;
  const locked = challenges.filter((c) => c.state === 'locked').length;

  const now = Date.now();
  const activeGlitch = glitches.find(
    (g) => new Date(g.startsAt).getTime() <= now && new Date(g.endsAt).getTime() > now,
  );
  const nextGlitch = glitches
    .filter((g) => new Date(g.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-[11px] tracking-[0.3em] text-[#5A6379]">ESTABLISHING COMMAND TELEMETRY…</div>
        ) : !adminEvent ? (
          <div className="text-[11px] tracking-[0.3em] text-[#E84D7E]">NO ACTIVE EVENT FOUND</div>
        ) : (
          <>
            {/* Header info */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ COMMAND ARCHIVE OVERVIEW</div>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-[#F2F5FA]">
                  {adminEvent.name}
                </h1>
                <div className="mt-1 flex items-center gap-4 text-[11px] text-[#5A6379]">
                  <span>SLUG: <strong className="text-[#8B93A9] font-mono">{adminEvent.slug}</strong></span>
                  <span>ID: <strong className="text-[#8B93A9] font-mono">{adminEvent.id}</strong></span>
                </div>
                {adminEvent.description && (
                  <p className="mt-2 text-[12px] text-[#8B93A9] max-w-2xl leading-relaxed">
                    {adminEvent.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateTo('ADMIN_EVENTS')}
                  className="px-4 py-2 border border-[#E0A83E]/40 text-[11px] tracking-[0.18em] text-[#E0A83E] hover:bg-[#E0A83E]/10 cursor-pointer"
                >
                  MANAGE ALL EVENTS →
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard
                label="STATUS"
                value={adminEvent.isPublished ? 'LIVE' : 'DRAFT'}
                color={adminEvent.isPublished ? '#5ED6E3' : '#5A6379'}
                sub={adminEvent.isPublished ? 'Open for players' : 'Hidden from public'}
              />
              <StatCard
                label="LEADERBOARD"
                value={adminEvent.isFrozen ? 'FROZEN' : 'LIVE'}
                color={adminEvent.isFrozen ? '#E84D7E' : '#5ED6E3'}
                sub={adminEvent.isFrozen ? 'Scores locked' : 'Real-time updates'}
              />
              <StatCard
                label="TOTAL CELLS"
                value={String(stats?.teamsCount ?? '0')}
                color="#F2F5FA"
                sub="Registered teams"
              />
              <StatCard
                label="CHALLENGES"
                value={`${visible}V / ${hidden}H`}
                color="#D5DBE7"
                sub={`${locked} locked · ${challenges.length} total`}
              />
              <StatCard
                label="TOTAL SOLVES"
                value={String(stats?.solvesCount ?? '0')}
                color="#5ED6E3"
                sub={`${stats?.submissionsCount ?? '0'} attempts`}
              />
            </div>

            {/* Time Window & Glitch Status */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#1E2536] bg-[#0B0E16]/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.25em] text-[#5A6379]">EVENT TIME WINDOW</span>
                  <span className={`text-[10px] tracking-[0.2em] font-bold ${
                    adminEvent.startsAt && new Date(adminEvent.startsAt).getTime() > now
                      ? 'text-[#E0A83E]'
                      : adminEvent.endsAt && new Date(adminEvent.endsAt).getTime() < now
                      ? 'text-[#E84D7E]'
                      : 'text-[#5ED6E3]'
                  }`}>
                    {adminEvent.startsAt && new Date(adminEvent.startsAt).getTime() > now
                      ? 'PENDING'
                      : adminEvent.endsAt && new Date(adminEvent.endsAt).getTime() < now
                      ? 'CLOSED'
                      : 'RUNNING'}
                  </span>
                </div>
                <div className="mt-3 text-[12px] space-y-1.5 text-[#D5DBE7]">
                  <div>STARTS: <span className="text-[#8B93A9] ml-2 font-mono">{fmtDate(adminEvent.startsAt)}</span></div>
                  <div>ENDS: <span className="text-[#8B93A9] ml-2 font-mono">{fmtDate(adminEvent.endsAt)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1E2536] flex flex-wrap gap-2">
                  <button
                    onClick={() => void setLiveWindow(48)}
                    disabled={busy}
                    className="px-3 py-1.5 border border-[#5ED6E3]/40 text-[10px] tracking-[0.15em] text-[#5ED6E3] hover:bg-[#5ED6E3]/10 cursor-pointer disabled:opacity-40"
                  >
                    GO LIVE NOW (48h)
                  </button>
                  <button
                    onClick={() => void setLiveWindow(24)}
                    disabled={busy}
                    className="px-3 py-1.5 border border-[#5ED6E3]/40 text-[10px] tracking-[0.15em] text-[#5ED6E3] hover:bg-[#5ED6E3]/10 cursor-pointer disabled:opacity-40"
                  >
                    GO LIVE NOW (24h)
                  </button>
                  <button
                    onClick={() => void endEventNow()}
                    disabled={busy}
                    className="px-3 py-1.5 border border-[#E84D7E]/40 text-[10px] tracking-[0.15em] text-[#E84D7E] hover:bg-[#E84D7E]/10 cursor-pointer disabled:opacity-40"
                  >
                    END EVENT NOW
                  </button>
                </div>
              </div>

              <div className="border border-[#1E2536] bg-[#0B0E16]/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.25em] text-[#5A6379]">TIME GLITCH ENGINE</span>
                  <button
                    onClick={() => navigateTo('ADMIN_GLITCHES')}
                    className="text-[10px] tracking-[0.15em] text-[#5ED6E3] hover:underline cursor-pointer"
                  >
                    CONFIGURE →
                  </button>
                </div>
                <div className="mt-3 text-[12px] space-y-1.5 text-[#D5DBE7]">
                  {activeGlitch ? (
                    <div className="text-[#5ED6E3] font-bold">
                      ACTIVE: {activeGlitch.label || 'Glitch Window'} — ends {fmtDate(activeGlitch.endsAt)}
                    </div>
                  ) : nextGlitch ? (
                    <div>NEXT: <span className="text-[#8B93A9] ml-2 font-mono">{fmtDate(nextGlitch.startsAt)}</span></div>
                  ) : (
                    <div className="text-[#5A6379]">No time glitches currently active or scheduled.</div>
                  )}
                  <div className="text-[11px] text-[#5A6379] mt-2">
                    {glitches.length} total glitch windows programmed for this event.
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Cards */}
            <div className="mt-8">
              <div className="text-[9px] tracking-[0.3em] text-[#E0A83E] mb-3">■ COMMAND SECTIONS</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <NavCard
                  title="LIVE LEADERBOARD"
                  detail="Real-time rankings & scores"
                  sub="Live cell standings, solve stats, and freeze controls"
                  onClick={() => navigateTo('ADMIN_LEADERBOARD')}
                  btnLabel="OPEN LEADERBOARD →"
                />
                <NavCard
                  title="CHALLENGES"
                  detail={`${challenges.length} challenges configured`}
                  sub="Add, edit flags, delete, and manage hints"
                  onClick={() => navigateTo('ADMIN_CHALLENGES')}
                  btnLabel="OPEN CHALLENGES →"
                />
                <NavCard
                  title="TIME GLITCHES"
                  detail={`${glitches.length} windows scheduled`}
                  sub="Schedule point boost windows and multipliers"
                  onClick={() => navigateTo('ADMIN_GLITCHES')}
                  btnLabel="OPEN GLITCHES →"
                />
                <NavCard
                  title="CELLS & ROSTER"
                  detail={`${stats?.teamsCount ?? '0'} teams registered`}
                  sub="View operatives, rosters, and ban/unban cells"
                  onClick={() => navigateTo('ADMIN_TEAMS')}
                  btnLabel="OPEN TEAMS →"
                />
                <NavCard
                  title="LIVE TELEMETRY"
                  detail={`${stats?.solvesCount ?? '0'} solves recorded`}
                  sub="Real-time submission audit and flag validation"
                  onClick={() => navigateTo('ADMIN_ACTIVITY')}
                  btnLabel="OPEN TELEMETRY →"
                />
                <NavCard
                  title="SPIN WHEEL AUDIT"
                  detail="Quantum wheel telemetry"
                  sub="Audit team spins, quotas, rewards & probability logs"
                  onClick={() => navigateTo('ADMIN_SPIN_WHEEL')}
                  btnLabel="OPEN SPIN AUDIT →"
                />
              </div>
            </div>

            {/* Controls Bar */}
            <div className="mt-8 border border-[#1E2536] bg-[#0A0D15] p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] text-[#E0A83E]">EVENT CONTROLS</div>
                <div className="text-[12px] text-[#8B93A9] mt-0.5">Toggle publication or leaderboard freeze state.</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={togglePublish}
                  disabled={busy}
                  className={`px-4 py-2 border text-[11px] font-bold tracking-[0.18em] cursor-pointer disabled:opacity-40 ${
                    adminEvent.isPublished
                      ? 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/10'
                      : 'border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10'
                  }`}
                >
                  {adminEvent.isPublished ? 'UNPUBLISH EVENT' : 'PUBLISH EVENT'}
                </button>
                <button
                  onClick={toggleFreeze}
                  disabled={busy}
                  className={`px-4 py-2 border text-[11px] font-bold tracking-[0.18em] cursor-pointer disabled:opacity-40 ${
                    adminEvent.isFrozen
                      ? 'border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10'
                      : 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/10'
                  }`}
                >
                  {adminEvent.isFrozen ? 'UNFREEZE BOARD' : 'FREEZE BOARD'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({
  label,
  value,
  color,
  sub,
}) => (
  <div className="border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5">
    <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</div>
    <div className="mt-1 text-[17px] font-bold tracking-[0.08em]" style={{ color }}>
      {value}
    </div>
    {sub && <div className="mt-1 text-[10px] text-[#5A6379] truncate">{sub}</div>}
  </div>
);

const NavCard: React.FC<{
  title: string;
  detail: string;
  sub: string;
  onClick: () => void;
  btnLabel: string;
}> = ({ title, detail, sub, onClick, btnLabel }) => (
  <div className="border border-[#1E2536] bg-[#0B0E16]/70 p-5 flex flex-col justify-between">
    <div>
      <div className="text-[12px] font-bold tracking-[0.15em] text-[#F2F5FA] font-display">{title}</div>
      <div className="mt-1 text-[11px] text-[#5ED6E3]">{detail}</div>
      <div className="mt-2 text-[11px] text-[#8B93A9] leading-relaxed">{sub}</div>
    </div>
    <button
      onClick={onClick}
      className="mt-5 w-full border border-[#1E2536] py-2 text-[10px] tracking-[0.18em] text-[#5ED6E3] hover:border-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06] cursor-pointer text-center"
    >
      {btnLabel}
    </button>
  </div>
);
