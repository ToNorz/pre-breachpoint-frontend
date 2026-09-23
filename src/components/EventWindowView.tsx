import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CornerTicks } from './LoginForm';
import { TONE } from '../data/pathsData';

const split = (ms: number) => ({
  d: Math.floor(ms / 86_400_000),
  h: Math.floor((ms % 86_400_000) / 3_600_000),
  m: Math.floor((ms % 3_600_000) / 60_000),
  s: Math.floor((ms % 60_000) / 1000),
});
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The lobby, shown before the gun.
 *
 * The server refuses every scoring action outside the event window, so there is
 * nothing to play yet — but teams *can* be formed, and should be, because doing
 * it here is four fewer minutes lost at the start. The clock rolls over into
 * the game on its own; nobody has to refresh.
 */
const Lobby: React.FC = () => {
  const { event, team, windowMs, currentUser, logout, navigateTo } = useGame();
  const t = split(windowMs ?? 0);

  return (
    <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] font-mono scan-faint flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="text-[10px] tracking-[0.35em] text-[#5A6379]">
          {event?.name ?? 'BREACHPOINT'} // NOT YET OPEN
        </div>

        <h1 className="mt-6 font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-4xl">
          The signal<br />hasn’t landed yet.
        </h1>

        <div className="relative mt-10 border border-[#1E2536] bg-[#0A0D15]/90 px-6 py-8">
          <CornerTicks />
          <div className="text-[10px] tracking-[0.3em] text-[#5A6379]">TRANSMISSION IN</div>
          <div className="mt-4 flex items-end justify-center gap-3 font-display text-[#5ED6E3]">
            {t.d > 0 && (
              <span className="text-5xl">
                {t.d}
                <span className="ml-1 text-[13px] text-[#5A6379]">d</span>
              </span>
            )}
            <span className="text-5xl tracking-[0.06em]">
              {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
            </span>
          </div>
          {event?.startsAt && (
            <div className="mt-4 text-[10px] tracking-[0.2em] text-[#454C61]">
              OPENS {new Date(event.startsAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="mt-6 border border-[#1E2536] bg-[#0B0E16]/50 px-6 py-5 text-left">
          {team ? (
            <>
              <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">YOUR CELL</div>
              <div className="mt-1 font-display text-xl text-[#F2F5FA]">{team.name}</div>
              <div className="mt-2 text-[11px] tracking-[0.15em] text-[#5A6379]">
                JOIN CODE <span className="text-[#5ED6E3]">{team.joinCode}</span> · pass it to your
                teammates now, not at the gun.
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] tracking-[0.25em] text-[#E0A83E]">NO CELL YET</div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#9AA2B5]">
                Nothing scores without a team. Form one now — it costs nothing before the event
                opens, and it is four minutes you don’t lose at the start.
              </p>
              <button
                onClick={() => navigateTo('TEAM')}
                className="mt-4 w-full bg-[#5ED6E3] hover:bg-[#7CE3EE] px-6 py-3 text-[#06232A] text-[11px] font-bold tracking-[0.25em] cursor-pointer"
              >
                FORM YOUR CELL →
              </button>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-center gap-5 text-[10px] tracking-[0.25em] text-[#5A6379]">
          <button onClick={() => navigateTo('GATE')} className="hover:text-[#8B93A9] cursor-pointer">
            [ READ THE INCIDENT ]
          </button>
          <button onClick={logout} className="hover:text-[#E84D7E] cursor-pointer">
            [ SIGN OUT{currentUser ? ` · ${currentUser.username}` : ''} ]
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * The closing board.
 *
 * After `endsAt` the server refuses submissions but still serves the
 * scoreboard, so this is a real final standing rather than a cached guess.
 */
const Closed: React.FC = () => {
  const { event, scoreboard, scoreboardFrozen, loadScoreboard, team, logout, navigateTo } = useGame();

  useEffect(() => {
    void loadScoreboard();
  }, [loadScoreboard]);

  const mine = scoreboard.find((t) => t.teamId === team?.id) ?? null;
  const medal = ['#E0A83E', '#5ED6E3', '#E84D7E'];

  return (
    <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] font-mono scan-faint px-5 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.35em] text-[#5A6379]">
            {event?.name ?? 'BREACHPOINT'} // CLOSED
          </div>
          <h1 className="mt-6 font-display font-bold uppercase leading-[1.05] tracking-tight text-[#F2F5FA] text-4xl">
            The window<br />has shut.
          </h1>
          <p className="mt-4 font-lore italic text-[18px] text-[#8B93A9]">
            “We have already tried this once.”
          </p>
        </div>

        {mine && (
          <div className="mt-10 border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-6 py-5 text-center">
            <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">FINAL — {mine.name}</div>
            <div className="mt-2 font-display text-[44px] leading-none text-[#5ED6E3]">
              {mine.points.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] tracking-[0.2em] text-[#5A6379]">
              RANK #{mine.rank} · {mine.solves} SOLVES
            </div>
          </div>
        )}

        {scoreboardFrozen && (
          <div className="mt-4 text-center text-[10px] tracking-[0.2em] text-[#E0A83E]">
            ■ STANDINGS FROZEN BEFORE THE CLOSE
          </div>
        )}

        <div className="mt-8 border border-[#1E2536] bg-[#0B0E16]/60">
          <div className="border-b border-[#1E2536] px-5 py-3 text-[10px] tracking-[0.25em] text-[#5A6379]">
            FINAL STANDINGS
          </div>
          {scoreboard.length === 0 && (
            <div className="px-5 py-8 text-center text-[12px] text-[#454C61]">No teams scored.</div>
          )}
          {scoreboard.slice(0, 20).map((t, i) => (
            <div
              key={t.teamId}
              className={`flex items-center justify-between gap-4 border-b border-[#141A2B] px-5 py-3 text-[12px] ${
                t.isMe ? 'bg-[#5ED6E3]/[0.04]' : ''
              }`}
              style={t.isMe ? { boxShadow: 'inset 2px 0 0 #5ED6E3' } : {}}
            >
              <span className="w-10 text-[#454C61]" style={i < 3 ? { color: medal[i] } : {}}>
                #{t.rank}
              </span>
              <span className={`flex-1 truncate ${t.isMe ? 'text-[#F2F5FA] font-semibold' : 'text-[#8B93A9]'}`}>
                {t.name}
              </span>
              <span className="text-[#5A6379]">{t.solves}</span>
              <span className="w-20 text-right font-semibold text-[#F2F5FA]">
                {t.points.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-5 text-[10px] tracking-[0.25em] text-[#5A6379]">
          <button onClick={() => navigateTo('GATE')} className="hover:text-[#8B93A9] cursor-pointer">
            [ THE INCIDENT ]
          </button>
          <button onClick={logout} className="hover:text-[#E84D7E] cursor-pointer">
            [ SIGN OUT ]
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-[10px] tracking-[0.3em]">
          {(['A'] as const).map((c) => (
            <span key={c} style={{ color: TONE[c] }}>PATH {c}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EventWindowView: React.FC<{ state: 'pending' | 'ended' }> = ({ state }) =>
  state === 'pending' ? <Lobby /> : <Closed />;
