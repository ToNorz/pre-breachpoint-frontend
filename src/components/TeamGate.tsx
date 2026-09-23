import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CornerTicks } from './LoginForm';

/**
 * Team formation. Nothing in the event scores without one — `core_solve`,
 * `sz_team_path` and `sz_skip` are all keyed on a team, and the event guard
 * refuses every point-changing action until the player is in one.
 *
 * Four to a team, one team per event, and joining needs both the name and the
 * code so a leaked code alone isn't enough.
 */
export const TeamGate: React.FC = () => {
  const { createTeam, joinTeam, logout, currentUser, event, busy } = useGame();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const isJoin = mode === 'join';
  const canSubmit = !busy && name.trim().length > 0 && (!isJoin || joinCode.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const result = isJoin ? await joinTeam(name, joinCode) : await createTeam(name);
    if (!result.success) setError(result.message);
    // A created team's join code is the one thing the player must pass to
    // teammates, so it is surfaced rather than left to the dashboard.
    else if (!isJoin) setCreated(result.message);
  };

  return (
    <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] font-mono scan-faint flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <div className="text-[10px] tracking-[0.3em] text-[#9BA6BC]">
          {event?.name ?? 'BREACHPOINT'} // OPERATIVE {currentUser?.username}
        </div>

        <div className="relative mt-4 border border-[#1E2536] bg-[#0A0D15]/90 px-7 py-8">
          <CornerTicks />
          <h1 className="font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-3xl">
            No one works<br />this alone.
          </h1>
          <p className="mt-4 text-[13px] leading-relaxed text-[#A6B2C8]">
            Form a cell or join one. Up to four operatives; progress, points and skips are
            shared across the whole team.
          </p>

          <div className="mt-6 flex gap-4 text-[10px] tracking-[0.25em]">
            <button
              type="button"
              onClick={() => { setMode('create'); setError(null); }}
              className={`pb-1 cursor-pointer transition-colors ${!isJoin ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#9BA6BC] hover:text-[#D5DBE7]'}`}
            >
              CREATE CELL
            </button>
            <button
              type="button"
              onClick={() => { setMode('join'); setError(null); }}
              className={`pb-1 cursor-pointer transition-colors ${isJoin ? 'text-[#5ED6E3] border-b border-[#5ED6E3]' : 'text-[#9BA6BC] hover:text-[#D5DBE7]'}`}
            >
              JOIN WITH CODE
            </button>
          </div>

          <form onSubmit={submit} className="mt-6">
            <label className="block text-[10px] tracking-[0.3em] text-[#C6CCDA] font-medium">TEAM NAME</label>
            <div className="mt-2 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
              <input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team_Kronos"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent font-mono text-[14px] tracking-[0.08em] text-[#5ED6E3] focus:outline-none placeholder-[#6E7891]"
              />
            </div>

            {isJoin && (
              <>
                <label className="mt-6 block text-[10px] tracking-[0.3em] text-[#C6CCDA] font-medium">JOIN CODE</label>
                <div className="mt-2 border border-[#1E2536] bg-black/40 px-4 py-3 focus-within:border-[#5ED6E3]/60">
                  <input
                    id="team-join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="6 CHARACTERS"
                    maxLength={6}
                    className="w-full bg-transparent font-mono text-[14px] tracking-[0.35em] text-[#D5DBE7] focus:outline-none placeholder-[#6E7891]"
                  />
                </div>
              </>
            )}

            {error && <div className="mt-4 text-[13px] text-[#E84D7E]">{error}</div>}
            {created && <div className="mt-4 text-[13px] text-[#5ED6E3]">{created}</div>}

            <button
              type="submit"
              id="btn-team-submit"
              disabled={!canSubmit}
              className="mt-6 w-full bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 disabled:cursor-not-allowed px-10 py-4 text-[#06232A] text-[12px] font-bold tracking-[0.3em] transition-colors cursor-pointer"
            >
              {busy ? 'STANDBY…' : isJoin ? 'JOIN THE CELL →' : 'FORM THE CELL →'}
            </button>
          </form>
        </div>

        <button
          onClick={logout}
          className="mt-4 text-[10px] tracking-[0.25em] text-[#E84D7E] hover:text-[#FF6B9B] font-bold cursor-pointer transition-colors"
        >
          [ SIGN OUT ]
        </button>
      </div>
    </div>
  );
};
