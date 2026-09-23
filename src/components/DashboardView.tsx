import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DashboardOverlay } from './DashboardOverlay';
import { WelcomeGate } from './WelcomeGate';
import { PATH_SKINS, TONE, FRAGMENT_LABEL } from '../data/pathsData';
import { PathId } from '../types';

const FREE_SWITCH_THRESHOLD = 8;

export const DashboardView: React.FC = () => {
  const {
    paths, chosenPath, choosePath, switchPath, navigateTo,
    getPathChallenges, resumeSlot, welcome, convergence, fragments,
    skips, rewardMultiplier, busy, team,
  } = useGame();

  const [pendingSwitch, setPendingSwitch] = useState<PathId | null>(null);
  const [pendingCommit, setPendingCommit] = useState<PathId | null>(null);

  const activePath = paths.find((p) => p.isActive) ?? null;
  const activeIsComplete = activePath
    ? activePath.isCompleted ||
      (activePath.total > 0 && activePath.solved + activePath.skipped >= activePath.total) ||
      fragments.includes(activePath.delivers)
    : false;
  const solvesOnActive = activePath?.solved ?? 0;
  const switchIsFree = activeIsComplete || solvesOnActive >= FREE_SWITCH_THRESHOLD;

  const resumeChallenge = resumeSlot
    ? getPathChallenges((resumeSlot[0] as PathId)).find((c) => c.slot === resumeSlot) ?? null
    : null;

  // The welcome challenge gates path selection: the server refuses `select`
  // until it is solved, so the dashboard leads with it rather than offering
  // three buttons that would all be rejected.
  const welcomeOpen = !!welcome && welcome.status !== 'solved';

  const renderPathAction = (code: PathId) => {
    const path = paths.find((p) => p.code === code);
    if (!path) return null;

    if (path.isActive) {
      if (activeIsComplete) {
        return (
          <div className="mt-3 flex flex-col gap-2">
            <div
              className="px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-center border"
              style={{ color: TONE[code], borderColor: `${TONE[code]}55` }}
            >
              COMPLETE ✓ {path.solved}/{path.total}
            </div>
            <button
              id={`btn-enter-path-${code.toLowerCase()}`}
              onClick={() => navigateTo('TRAIL', null, code)}
              className="w-full px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer"
              style={{ background: TONE[code] }}
            >
              VIEW TRAIL →
            </button>
          </div>
        );
      }
      return (
        <button
          id={`btn-enter-path-${code.toLowerCase()}`}
          onClick={() => navigateTo('TRAIL', null, code)}
          className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer"
          style={{ background: TONE[code] }}
        >
          ENTER PATH {code} →
        </button>
      );
    }

    // Previously entered path that is not currently active:
    // It is NOT sealed! It is open and solvable!
    if (path.isAttempted) {
      const complete = path.isCompleted || (path.total > 0 && path.solved + path.skipped >= path.total);
      return (
        <div className="mt-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-[0.2em] text-[#5ED6E3] font-semibold text-center">
            {complete ? '✓ PATH COMPLETED' : '✦ PREVIOUS PATH · SOLVABLE'}
          </div>
          <button
            id={`btn-enter-path-${code.toLowerCase()}`}
            onClick={() => navigateTo('TRAIL', null, code)}
            className="w-full px-4 py-2.5 text-[11px] font-bold tracking-[0.2em] border cursor-pointer hover:bg-white/[0.04] transition-colors"
            style={{ borderColor: `${TONE[code]}88`, color: TONE[code] }}
          >
            PLAY PATH {code} ({path.solved}/{path.total}) →
          </button>
        </div>
      );
    }

    if (!chosenPath) {
      if (welcomeOpen) {
        return (
          <button
            id={`btn-enter-path-${code.toLowerCase()}`}
            disabled
            title={`Solve ${welcome?.title ?? 'the welcome challenge'} first — it gates path selection.`}
            className="mt-3 w-full px-4 py-2.5 text-[11.5px] font-bold tracking-[0.18em] border border-[#2B354C] bg-[#0E131F] text-[#C6CCDA] cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="text-[#E84D7E]">🔒</span> SEALED — DECODE FIRST
          </button>
        );
      }
      return (
        <button
          id={`btn-enter-path-${code.toLowerCase()}`}
          onClick={() => setPendingCommit(code)}
          disabled={busy}
          className="mt-3 w-full px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] text-[#06232A] cursor-pointer hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)]"
          style={{ background: TONE[code] }}
        >
          COMMIT TO PATH {code} →
        </button>
      );
    }

    // Unattempted path while chosenPath exists!
    if (activeIsComplete) {
      return (
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => setPendingSwitch(code)}
            disabled={busy}
            className="w-full px-4 py-2.5 text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40 text-[#06232A]"
            style={{ background: TONE[code] }}
          >
            CHOOSE PATH {code} — FREE (0 PTS)
          </button>
          <button
            onClick={() => navigateTo('TRAIL', null, code)}
            className="text-[10px] tracking-[0.2em] text-center text-[#8B93A9] hover:text-[#5ED6E3] cursor-pointer transition-colors"
          >
            PREVIEW TRAIL →
          </button>
        </div>
      );
    }

    // Active path is in progress (NOT completed yet).
    // The other path is locked for free switch, but can be unlocked in-between for 1,000 points.
    return (
      <div className="mt-3 flex flex-col gap-1.5">
        <button
          onClick={() => setPendingSwitch(code)}
          disabled={busy}
          className="w-full px-4 py-2 border text-[10.5px] font-bold tracking-[0.15em] cursor-pointer hover:bg-[#E84D7E]/10 disabled:opacity-40 text-[#E84D7E] border-[#E84D7E]/50"
        >
          UNLOCK IN-BETWEEN (-1000 PTS)
        </button>
        <div className="text-[9px] text-center text-[#9BA6BC] font-medium tracking-wider">
          🔒 LOCKED FOR FREE (COSTS 1,000 PTS TO UNLOCK IN-BETWEEN)
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#07090F] scan-faint">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <WelcomeGate />

        {activePath && activeIsComplete && (
          <div className="mb-4 border border-[#5ED6E3]/60 bg-[#5ED6E3]/[0.08] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(94,214,227,0.12)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#5ED6E3] shadow-[0_0_6px_#5ED6E3]" />
                <span className="text-[11px] font-bold tracking-[0.25em] text-[#5ED6E3]">
                  PATH {activePath.code} COMPLETE · FRAGMENT SECURED
                </span>
              </div>
              <div className="mt-1 text-[12px] text-[#C6CCDA]">
                Choose your next path for <b className="text-[#5ED6E3]">FREE (0 points deducted · 100% rewards)</b>. Previous paths remain available to solve.
              </div>
            </div>
          </div>
        )}



        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as PathId[]).map((code) => {
              const path = paths.find((p) => p.code === code);
              const skin = PATH_SKINS[code];
              const held = path ? fragments.includes(path.delivers) : false;
              return (
                <div
                  key={code}
                  className="border border-[#1E2536] bg-[#0B0E16]/50 px-5 py-4 flex flex-col"
                  style={path?.isActive ? { borderLeft: `3px solid ${TONE[code]}` } : {}}
                >
                  <div className="text-[11px] font-semibold tracking-[0.25em]" style={{ color: TONE[code] }}>
                    PATH {code} · {path?.name ?? '—'}
                  </div>
                  <div className="text-[10.5px] text-[#8B93A9] mt-1">
                    KEY {skin.keyNumber} ({path ? FRAGMENT_LABEL[path.delivers] : '—'}) · Led by {skin.lead}
                  </div>
                  <p className="mt-2 font-lore italic text-[14px] text-[#C6CCDA] leading-snug line-clamp-4">
                    {path?.introNarration ?? 'Awaiting transmission.'}
                  </p>
                  <div className="mt-3 text-[11px] text-[#A6B2C8]">
                    <b style={{ color: TONE[code] }}>{path?.solved ?? 0}/{path?.total ?? 10}</b>
                    {' · '}
                    <b className="text-[#F2F5FA]">{(path?.points ?? 0).toLocaleString()}</b> PTS
                    {path?.isActive && <span className="ml-2" style={{ color: TONE[code] }}>● ACTIVE</span>}
                    {held && <span className="ml-2 text-[#5ED6E3]">✦ FRAGMENT HELD</span>}
                    {path?.skipped ? <span className="ml-2 text-[#E84D7E] font-medium">{path.skipped} SKIPPED</span> : null}
                  </div>
                  <div className="mt-auto">{renderPathAction(code)}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
          <button
            id="btn-resume-challenge"
            onClick={() => resumeChallenge && navigateTo('CHALLENGE', resumeChallenge.slot)}
            disabled={!resumeChallenge}
            className="w-full border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.04] px-4 py-5 text-center hover:bg-[#5ED6E3]/[0.08] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="block text-[13px] font-bold tracking-[0.25em] text-[#5ED6E3]">RESUME</span>
            <span className="mt-1 block text-[10px] tracking-[0.15em] text-[#8B93A9]">
              {resumeChallenge ? `${resumeChallenge.slot} · ${resumeChallenge.title}` : 'NO ACTIVE TRAIL'}
            </span>
          </button>
        </section>

        <button
          id="btn-dashboard-rite"
          onClick={() => navigateTo('CONVERGENCE')}
          disabled={!convergence}
          className={`mt-4 w-full py-4 text-[12px] font-bold tracking-[0.22em] transition-all cursor-pointer ${
            convergence
              ? 'bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] shadow-[0_0_20px_rgba(94,214,227,0.3)]'
              : 'bg-[#0E131F] border border-[#2B354C] text-[#C6CCDA] cursor-not-allowed'
          }`}
        >
          {convergence ? (
            'GO TO RITE — THE FINAL FLAG →'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-[#E84D7E]">🔒</span>
              <span>CONVERGENCE SEALED — <b className="text-[#5ED6E3]">{fragments.length}/3</b> FRAGMENTS SECURED</span>
            </span>
          )}
        </button>

        {team?.joinCode && (
          <div className="mt-6 p-4 border border-[#2B354C] bg-[#0A0D15]/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#5ED6E3] shadow-[0_0_8px_#5ED6E3]" />
              <div>
                <span className="text-[10.5px] tracking-[0.25em] text-[#A6B2C8] font-semibold">CELL: </span>
                <span className="text-[13px] font-bold text-[#F2F5FA] font-mono">{team.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10.5px] tracking-[0.25em] text-[#A6B2C8] font-semibold">JOIN CODE:</span>
              <span className="px-3 py-1 font-mono text-[14px] font-bold tracking-[0.2em] border border-[#5ED6E3]/60 bg-[#5ED6E3]/15 text-[#5ED6E3] select-all">
                {team.joinCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {pendingCommit && (
        <DashboardOverlay title={`CONFIRM PATH SELECTION`} onClose={() => setPendingCommit(null)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            “Commit your team to Path {pendingCommit}?”
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">
            Choosing Path <b className="text-[#5ED6E3]">{pendingCommit} ({paths.find((p) => p.code === pendingCommit)?.name})</b> will unlock its initial challenges for your team.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[#A6B2C8]">
            Other paths will remain locked until you complete this path for free, or you can unlock them in-between for a 1,000 points cost.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPendingCommit(null)}
              className="text-[11px] tracking-[0.2em] text-[#8B93A9] hover:text-[#F2F5FA] cursor-pointer transition-colors"
            >
              ← CANCEL
            </button>
            <button
              id="btn-confirm-choose-path"
              onClick={() => {
                void choosePath(pendingCommit);
                setPendingCommit(null);
              }}
              disabled={busy}
              className="px-6 py-2.5 text-[#07090F] text-[12px] font-bold tracking-[0.2em] cursor-pointer bg-[#5ED6E3] hover:brightness-110"
            >
              CONFIRM & COMMIT TO PATH {pendingCommit} →
            </button>
          </div>
        </DashboardOverlay>
      )}

      {pendingSwitch && (
        <DashboardOverlay title={switchIsFree ? "CHOOSE NEXT PATH (FREE)" : "UNLOCK PATH IN-BETWEEN (-1,000 PTS)"} onClose={() => setPendingSwitch(null)}>
          <p className="font-lore italic text-[19px] leading-relaxed text-[#F2F5FA]">
            {switchIsFree
              ? `“Path ${chosenPath} is complete! Enter Path ${pendingSwitch}?”`
              : `“Unlock Path ${pendingSwitch} in-between for 1,000 points?”`}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9AA2B5]">
            {switchIsFree ? (
              <>
                Path <b className="text-[#5ED6E3]">{chosenPath}</b> has been completed!
                Switching to Path <b className="text-[#5ED6E3]">{pendingSwitch}</b> is{' '}
                <b className="text-[#5ED6E3]">FREE of points</b> (0 points deducted) and pays{' '}
                <b className="text-[#5ED6E3]">100% full rewards</b>.
              </>
            ) : (
              <>
                You have not completed Path <b className="text-[#E84D7E]">{chosenPath}</b> yet.
                Unlocking Path <b className="text-[#E84D7E]">{pendingSwitch}</b> in-between will deduct{' '}
                <b className="text-[#E84D7E]">1,000 points</b> from your team's score. Points can go negative.
                Rewards on Path <b className="text-[#5ED6E3]">{pendingSwitch}</b> remain at full 100% value.
                To unlock for FREE (0 points deducted), finish Path {chosenPath} first!
              </>
            )}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[#A6B2C8]">
            Points already banked are preserved. Challenges on previous paths remain{' '}
            <b className="text-[#F2F5FA]">UNLOCKED and AVAILABLE TO SOLVE</b> at any time.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPendingSwitch(null)}
              className="text-[11px] tracking-[0.2em] text-[#8B93A9] hover:text-[#F2F5FA] cursor-pointer transition-colors"
            >
              ← STAY ON PATH {chosenPath}
            </button>
            <button
              id="btn-confirm-switch"
              onClick={() => { void switchPath(pendingSwitch); setPendingSwitch(null); }}
              disabled={busy}
              className={`px-6 py-2.5 text-[#07090F] text-[12px] font-bold tracking-[0.2em] cursor-pointer ${
                switchIsFree ? 'bg-[#5ED6E3] hover:brightness-110' : 'bg-[#E84D7E] hover:brightness-110'
              }`}
            >
              {switchIsFree ? `ENTER PATH ${pendingSwitch} (FREE) →` : `UNLOCK FOR 1,000 PTS →`}
            </button>
          </div>
        </DashboardOverlay>
      )}
    </div>
  );
};
