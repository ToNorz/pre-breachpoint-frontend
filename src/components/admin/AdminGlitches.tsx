import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminTimeGlitch } from '../../services/api';
import { AdminNav } from './AdminNav';
import { CornerTicks } from '../LoginForm';

export const AdminGlitches: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [glitches, setGlitches] = useState<AdminTimeGlitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!adminEvent) return;
    setLoading(true);
    try {
      setGlitches(await api.adminListGlitches(adminEvent.id));
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch time glitches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [adminEvent]);

  const now = Date.now();
  const active = glitches.filter(
    (g) => new Date(g.startsAt).getTime() <= now && new Date(g.endsAt).getTime() > now
  );
  const upcoming = glitches
    .filter((g) => new Date(g.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = glitches
    .filter((g) => new Date(g.endsAt).getTime() <= now)
    .sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());

  const isGlitchActive = active.length > 0;

  const toggleGlitch = async () => {
    if (!adminEvent || busy) return;
    setBusy(true);
    try {
      if (isGlitchActive) {
        // Turn OFF: Delete all currently active glitches
        await Promise.all(active.map((g) => api.adminDeleteGlitch(adminEvent.id, g.id)));
        notify('success', 'GLITCH DEACTIVATED', 'Time glitch turned OFF. Normal decay restored.');
      } else {
        // Turn ON: Create a live active glitch
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 120 * 60 * 1000); // 2 hours active window
        await api.adminCreateGlitch(adminEvent.id, {
          label: 'Broadcast Glitch (Active)',
          startsAt: startTime.toISOString(),
          endsAt: endTime.toISOString(),
          multiplier: 2,
        });
        notify('success', 'GLITCH ACTIVATED', 'Time glitch turned ON. Decay suspended & 2× multiplier active.');
      }
      await load();
    } catch (err: unknown) {
      notify('error', 'ACTION FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (id: string) => {
    if (!adminEvent) return;
    try {
      await api.adminDeleteGlitch(adminEvent.id, id);
      notify('success', 'DELETED', 'Time glitch removed.');
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString();
  const duration = (g: AdminTimeGlitch) => {
    const ms = new Date(g.endsAt).getTime() - new Date(g.startsAt).getTime();
    const m = Math.round(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8 scan-faint">
        {/* Main Controls Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ GLITCH ENGINE CONTROL</div>
            <h1 className="mt-1 font-display text-2xl tracking-wide text-[#F2F5FA]">TIME GLITCHES</h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              {glitches.length} total windows · {active.length} active now
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Switch Component */}
            <div className="flex items-center gap-3 bg-[#0B0E16] border border-[#1E2536] px-4 py-2.5 rounded">
              <span className="text-[11px] tracking-[0.2em] font-semibold text-[#8B93A9]">
                GLITCH:
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isGlitchActive}
                disabled={busy}
                onClick={toggleGlitch}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  isGlitchActive
                    ? 'bg-[#5ED6E3] border-[#5ED6E3] shadow-[0_0_12px_rgba(94,214,227,0.5)]'
                    : 'bg-[#151A28] border-[#2C3550]'
                } disabled:opacity-50`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                    isGlitchActive ? 'translate-x-7 bg-[#07090F]' : 'translate-x-1 bg-[#5A6379]'
                  }`}
                />
              </button>
              <span
                className={`text-[12px] font-bold tracking-[0.2em] min-w-[36px] ${
                  isGlitchActive ? 'text-[#5ED6E3]' : 'text-[#5A6379]'
                }`}
              >
                {busy ? '…' : isGlitchActive ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Card Banner */}
        <div
          className={`mt-6 p-5 border transition-all relative ${
            isGlitchActive
              ? 'bg-[#5ED6E3]/5 border-[#5ED6E3]/40 shadow-[0_0_20px_rgba(94,214,227,0.1)]'
              : 'bg-[#0B0E16] border-[#1E2536]'
          }`}
        >
          <CornerTicks color={isGlitchActive ? '#5ED6E3' : '#5A6379'} />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isGlitchActive ? 'bg-[#5ED6E3] animate-pulse shadow-[0_0_8px_#5ED6E3]' : 'bg-[#5A6379]'
                  }`}
                />
                <span
                  className={`text-[11px] font-bold tracking-[0.25em] ${
                    isGlitchActive ? 'text-[#5ED6E3]' : 'text-[#8B93A9]'
                  }`}
                >
                  {isGlitchActive ? 'BROADCASTING ACTIVE GLITCH' : 'SYSTEM STANDBY — NO ACTIVE GLITCH'}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed max-w-2xl">
                {isGlitchActive
                  ? 'Time glitch window is live across the CTF. Node point decay is suspended and initial points are restored with 2× multiplier on solves.'
                  : 'Normal operational state. Node point decay curves apply normally. Click the toggle switch above to broadcast a glitch immediately.'}
              </p>
              {isGlitchActive && active[0] && (
                <div className="mt-3 text-[11px] text-[#D5DBE7] flex flex-wrap gap-4 font-mono">
                  <span>
                    Window:{' '}
                    <span className="text-[#5ED6E3]">
                      {fmtDate(active[0].startsAt)} → {fmtDate(active[0].endsAt)}
                    </span>
                  </span>
                  <span>
                    Duration: <span className="text-[#5ED6E3]">{duration(active[0])}</span>
                  </span>
                  <span>
                    Effect: <span className="text-[#5ED6E3]">Decay Suspended (Full Points)</span>
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={toggleGlitch}
              disabled={busy}
              className={`px-5 py-2.5 text-[11px] font-bold tracking-[0.2em] cursor-pointer transition-all ${
                isGlitchActive
                  ? 'bg-[#E84D7E]/20 border border-[#E84D7E] text-[#E84D7E] hover:bg-[#E84D7E]/30'
                  : 'bg-[#5ED6E3] text-[#06232A] hover:brightness-110 shadow-[0_0_12px_rgba(94,214,227,0.3)]'
              } disabled:opacity-40`}
            >
              {busy ? 'PROCESSING…' : isGlitchActive ? 'TURN OFF GLITCH' : 'TURN ON GLITCH'}
            </button>
          </div>
        </div>

        {/* Glitches Schedule List */}
        {loading ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#5A6379]">LOADING…</div>
        ) : (
          <div className="mt-8 space-y-6">
            {active.length > 0 && (
              <GlitchSection
                title="ACTIVE NOW"
                color="#5ED6E3"
                glitches={active}
                fmtDate={fmtDate}
                duration={duration}
                onDelete={removeOne}
              />
            )}
            {upcoming.length > 0 && (
              <GlitchSection
                title="UPCOMING"
                color="#E0A83E"
                glitches={upcoming}
                fmtDate={fmtDate}
                duration={duration}
                onDelete={removeOne}
              />
            )}
            {past.length > 0 && (
              <GlitchSection
                title="PAST"
                color="#5A6379"
                glitches={past}
                fmtDate={fmtDate}
                duration={duration}
                onDelete={removeOne}
              />
            )}
            {glitches.length === 0 && (
              <div className="mt-6 text-center text-[12px] text-[#5A6379] py-12 border border-[#1E2536]/40">
                No time glitches currently in database. Turn on the toggle switch above to broadcast a live glitch.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const GlitchSection: React.FC<{
  title: string;
  color: string;
  glitches: AdminTimeGlitch[];
  fmtDate: (d: string) => string;
  duration: (g: AdminTimeGlitch) => string;
  onDelete: (id: string) => void;
}> = ({ title, color, glitches, fmtDate, duration, onDelete }) => (
  <div>
    <div className="text-[10px] tracking-[0.25em] font-bold mb-2" style={{ color }}>
      ■ {title} ({glitches.length})
    </div>
    <div className="border border-[#1E2536] divide-y divide-[#1E2536]/50">
      {glitches.map((g) => (
        <div key={g.id} className="flex items-center justify-between px-4 py-3 bg-[#0B0E16]/40 hover:bg-[#0E1220] transition-colors">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-[#D5DBE7] font-medium truncate">{g.label ?? 'Unnamed glitch'}</div>
            <div className="text-[11px] text-[#5A6379] mt-0.5 font-mono">
              {fmtDate(g.startsAt)} → {fmtDate(g.endsAt)} · {duration(g)}
            </div>
            <div className="text-[11px] text-[#5A6379] mt-0.5">
              Effect: <span className="text-[#5ED6E3] font-semibold">{g.multiplier ? `${g.multiplier}× Multiplier` : 'Decay Suspended (Full Points)'}</span>
            </div>
          </div>
          <button
            onClick={() => onDelete(g.id)}
            className="text-[11px] font-bold tracking-[0.15em] text-[#E84D7E] hover:text-[#F2F5FA] hover:underline cursor-pointer ml-3 shrink-0"
          >
            DELETE
          </button>
        </div>
      ))}
    </div>
  </div>
);
