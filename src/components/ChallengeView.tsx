import React, { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META } from '../services/backend';
import { TONE } from '../data/pathsData';
import { Hint } from '../types';
import { api } from '../services/api';
import { SpinWheelModal } from './SpinWheelModal';

export const ChallengeView: React.FC = () => {
  const {
    activeChallenge, navigateTo, submitFlag, skipChallenge, openBriefing,
    getPathChallenges, skips, rewardMultiplier, loadHints, unlockHint, busy,
    currentUser, event, notify, refresh, paths,
  } = useGame();

  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [hints, setHints] = useState<Hint[] | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const challengeId = activeChallenge?.id ?? null;
  const pathObj = activeChallenge ? paths.find((p) => p.code === activeChallenge.pathId) : null;
  const effectiveMultiplier = pathObj?.rewardMultiplier ? Number(pathObj.rewardMultiplier) : rewardMultiplier;

  const refreshHints = useCallback(async () => {
    if (!challengeId) return;
    setHints(await loadHints(challengeId));
  }, [challengeId, loadHints]);

  // Reset per-challenge UI when navigating between nodes.
  useEffect(() => {
    setFlag('');
    setStatus({ type: 'idle', message: '' });
    setHints(null);
    setShowHints(false);
    setConfirmSkip(false);
  }, [challengeId]);

  useEffect(() => {
    if (showHints && hints === null) void refreshHints();
  }, [showHints, hints, refreshHints]);

  if (!activeChallenge || !activeChallenge.id) {
    return (
      <div className="flex-1 bg-[#07090F] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-[13px] text-[#8B93A9]">
          {activeChallenge
            ? 'This node has not been revealed to your team yet.'
            : 'No challenge selected.'}
        </div>
        <button onClick={() => navigateTo('MAP')} className="text-[12px] text-[#5ED6E3] cursor-pointer">
          ← BACK TO CHART
        </button>
      </div>
    );
  }

  const tone = TONE[activeChallenge.pathId];
  const diff = DIFFICULTY_META[activeChallenge.difficulty];
  const solved = activeChallenge.status === 'solved';
  const skipped = activeChallenge.status === 'skipped';
  const closed = solved || skipped;

  // Siblings for prev/next come from the whole path so the arrows still work
  // across nodes that are revealed but not adjacent in the open set.
  const all = getPathChallenges(activeChallenge.pathId);
  const i = all.findIndex((c) => c.slot === activeChallenge.slot);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  const [flagHover, setFlagHover] = useState(false);
  // Fixed gold from the PRE-TRANSMISSION box (Path A amber), not the path tone.
  const GOLD = '#E0A83E';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    const r = await submitFlag(activeChallenge.id, flag);
    setStatus({ type: r.success ? 'success' : 'error', message: r.message });
    if (r.success) setFlag('');
  };

  const doSkip = async () => {
    setConfirmSkip(false);
    const r = await skipChallenge(activeChallenge.id);
    if (!r.success) {
      setStatus({ type: 'error', message: r.message });
      return;
    }
    if (next && next.id) navigateTo('CHALLENGE', next.slot);
    else navigateTo('MAP');
  };

  const buyHint = async (hint: Hint) => {
    const r = await unlockHint(activeChallenge.id, hint.id);
    setStatus({ type: r.success ? 'success' : 'error', message: r.message });
    if (r.success) await refreshHints();
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex justify-between text-[11px] tracking-[0.2em] text-[#8B93A9]">
          <button
            onClick={() => navigateTo('MAP', null, activeChallenge.pathId)}
            className="hover:text-[#5ED6E3] font-medium transition-colors cursor-pointer"
          >
            ← CHART
          </button>
          <span className="flex items-center gap-4">
            {currentUser?.isAdmin && (
              <button
                onClick={() => setShowAdminEdit(true)}
                className="px-2.5 py-0.5 border border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10 text-[10px] font-mono tracking-wider cursor-pointer transition-colors"
              >
                ⚡ EDIT CHALLENGE
              </button>
            )}
            <button onClick={() => prev && navigateTo('CHALLENGE', prev.slot)} disabled={!prev} className="disabled:opacity-30 hover:text-[#F2F5FA] cursor-pointer">←</button>
            <button onClick={() => next && navigateTo('CHALLENGE', next.slot)} disabled={!next} className="disabled:opacity-30 hover:text-[#F2F5FA] cursor-pointer">→</button>
          </span>
        </div>

        <div className="mt-10 text-[11px] font-semibold tracking-[0.25em]" style={{ color: tone }}>
          {activeChallenge.slot} · {activeChallenge.category}
          {solved ? ' · HELD ✓' : skipped ? ' · SKIPPED' : ''}
        </div>
        <h1 className="mt-3 font-display uppercase tracking-wide text-3xl sm:text-5xl leading-tight text-[#F2F5FA]">
          {activeChallenge.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#8B93A9]">
          <span
            className="font-bold tracking-[0.15em] px-1.5 py-0.5 border"
            style={{ color: diff.color, borderColor: `${diff.color}66` }}
          >
            {diff.label}
          </span>
          {/* The live price, priced by the server. The path multiplier is
              applied on top of it at solve time. */}
          <span className="text-[#F2F5FA]">
            · {Math.round(activeChallenge.currentPoints * effectiveMultiplier)} PTS
          </span>
          {activeChallenge.currentPoints < activeChallenge.points && (
            <span className="text-[#8B93A9]">
              · decayed from {activeChallenge.points}
              {activeChallenge.solves > 0 && ` by ${activeChallenge.solves} solve${activeChallenge.solves === 1 ? '' : 's'}`}
            </span>
          )}
          {activeChallenge.solves === 0 && (
            <span className="text-[#E0A83E]">· UNSOLVED — FIRST BLOOD</span>
          )}
          {effectiveMultiplier < 1 && (
            <span className="text-[#E84D7E]">· ×{effectiveMultiplier.toFixed(2)} PATH PENALTY</span>
          )}
          {activeChallenge.maxAttempts !== null && (
            <span className="text-[#E0A83E]">· MAX {activeChallenge.maxAttempts} ATTEMPTS</span>
          )}
          {activeChallenge.isPathFinal && <span style={{ color: tone }}>· PATH FINAL — FRAGMENT</span>}
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[0.3em] text-[#5A6379]">
          OBJECTIVE // {activeChallenge.era} · {activeChallenge.track}
        </div>
        <p className="mt-3 text-[15px] text-[#C6CCDA] leading-[1.8] max-w-3xl whitespace-pre-line">
          {activeChallenge.objective}
        </p>

        {/* Challenge Attachment / Target Link */}
        {activeChallenge.resourceLink && (
          <div className="mt-5">
            <a
              href={activeChallenge.resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-mono font-semibold tracking-[0.2em] border border-[#5ED6E3]/40 bg-[#5ED6E3]/10 text-[#5ED6E3] hover:bg-[#5ED6E3]/20 hover:border-[#5ED6E3]/70 hover:shadow-[0_0_15px_rgba(94,214,227,0.15)] transition-all cursor-pointer"
            >
              <span>
                {activeChallenge.resourceLink.includes('drive.google')
                  ? '⬇ DOWNLOAD ATTACHMENT'
                  : '↗ ACCESS CHALLENGE TARGET'}
              </span>
            </a>
          </div>
        )}

        {/* Pre-transmission narration, served per-challenge from sz_path_challenge. */}
        {activeChallenge.preStory && (
          <div
            className="mt-8 border-l-2 pl-5 pr-5 py-4 max-w-3xl"
            style={{ borderColor: `${tone}88`, background: `${tone}08` }}
          >
            <div className="text-[10px] font-semibold tracking-[0.3em]" style={{ color: tone }}>
              PRE-TRANSMISSION // PATH {activeChallenge.pathId} · {activeChallenge.slot}
            </div>
            <p className="mt-3 font-lore italic text-[18px] leading-[1.7] text-[#E8ECF3]">
              “{activeChallenge.preStory}”
            </p>
            <button
              onClick={() => openBriefing(activeChallenge.slot)}
              className="mt-3 text-[12px] font-semibold tracking-[0.15em] hover:brightness-110 cursor-pointer"
              style={{ color: tone }}
            >
              HEAR FULL PRE-BRIEF →
            </button>
          </div>
        )}

        {/* The debrief the server released on solving. */}
        {solved && activeChallenge.postStory && (
          <div className="mt-8 border-l-2 border-[#5ED6E3]/60 bg-[#5ED6E3]/[0.04] pl-5 pr-5 py-4 max-w-3xl">
            <div className="text-[10px] font-semibold tracking-[0.3em] text-[#5ED6E3]">
              POST-TRANSMISSION // DEBRIEF {activeChallenge.slot}
            </div>
            <p className="mt-3 font-lore italic text-[17px] leading-[1.7] text-[#E8ECF3]">
              {activeChallenge.postStory}
            </p>
          </div>
        )}

        {/* Hints and Quantum Spin Wheel access */}
        <div className="mt-8 border-t border-[#1E2536] pt-6 max-w-4xl flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setShowHints(true);
              if (hints === null) void refreshHints();
            }}
            className="px-3.5 py-2 border border-[#E0A83E]/40 bg-[#E0A83E]/5 text-[11px] font-semibold tracking-[0.2em] text-[#E0A83E] hover:bg-[#E0A83E]/15 cursor-pointer flex items-center gap-2 transition-colors"
          >
            <span>💡</span> HINTS & INTEL ({hints ? hints.length : '…'})
          </button>

          <button
            type="button"
            onClick={() => setShowSpinWheel(true)}
            className="px-3.5 py-2 border border-[#5ED6E3]/50 bg-[#5ED6E3]/10 text-[11px] font-semibold tracking-[0.2em] text-[#5ED6E3] hover:bg-[#5ED6E3]/20 cursor-pointer flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(94,214,227,0.15)]"
          >
            <span className="text-[13px]">⚡</span> QUANTUM WHEEL
          </button>
        </div>

        {/* Modal Popup for Hints on top of ChallengeView */}
        {showHints && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowHints(false)}
          >
            <div
              className="max-w-lg w-full max-h-[85vh] overflow-y-auto border border-[#E0A83E]/60 bg-[#0B0E16] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
                <div className="text-[11px] tracking-[0.25em] text-[#E0A83E] font-bold font-display">
                  INTELLIGENCE HINTS // {activeChallenge.title}
                </div>
                <button
                  type="button"
                  onClick={() => setShowHints(false)}
                  className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono"
                >
                  ESC / CLOSE ×
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {/* Quantum Wheel callout inside Hints & Intel dialog */}
                <div className="p-3.5 border border-[#5ED6E3]/40 bg-[#5ED6E3]/5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-[#5ED6E3] font-mono flex items-center gap-1.5">
                      <span>🎡</span> QUANTUM WHEEL
                    </div>
                    <div className="text-[10px] text-[#8B93A9] mt-0.5">
                      Spin for 0-pt hints, bonus games, or extra spins! (10 spins/team)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHints(false);
                      setShowSpinWheel(true);
                    }}
                    className="px-3 py-1.5 border border-[#5ED6E3] bg-[#5ED6E3]/20 hover:bg-[#5ED6E3]/30 text-[#5ED6E3] text-[10px] font-mono tracking-[0.15em] font-bold cursor-pointer whitespace-nowrap transition-colors"
                  >
                    SPIN NOW →
                  </button>
                </div>
                {hints === null && <div className="text-[12px] text-[#8B93A9] py-4 text-center">Reading hint telemetry…</div>}
                {hints?.length === 0 && (
                  <div className="text-[12px] text-[#8B93A9] py-4 text-center">No hints published for this challenge.</div>
                )}
                {hints?.map((hint, idx) => (
                  <div key={hint.id} className="border border-[#1E2536] bg-[#07090F] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] tracking-[0.2em] text-[#8B93A9] font-mono">
                        HINT {idx + 1} · {hint.cost} PTS
                      </span>
                      {!hint.isUnlocked && (
                        <button
                          onClick={() => buyHint(hint)}
                          disabled={busy}
                          className="text-[11px] font-semibold tracking-[0.15em] text-[#E0A83E] hover:brightness-125 disabled:opacity-40 cursor-pointer"
                        >
                          DECRYPT −{hint.cost} PTS →
                        </button>
                      )}
                    </div>
                    {hint.isUnlocked && hint.body && (
                      <p className="mt-2.5 text-[13px] leading-relaxed text-[#C6CCDA] border-t border-[#1E2536]/40 pt-2">{hint.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-10 max-w-4xl">
          <div
            className="relative border px-5 py-5 transition-all duration-300"
            onMouseEnter={() => setFlagHover(true)}
            onMouseLeave={() => setFlagHover(false)}
            style={{
              borderColor: flagHover ? GOLD : `${GOLD}3A`,
              background: flagHover
                ? `linear-gradient(180deg, ${GOLD}26, rgba(11,14,22,0.9) 60%)`
                : `linear-gradient(180deg, ${GOLD}07, rgba(11,14,22,0.92) 60%)`,
              boxShadow: flagHover
                ? `0 0 0 1px ${GOLD}55, 0 0 42px ${GOLD}66, inset 0 0 24px ${GOLD}11`
                : 'none',
            }}
          >
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300"
              style={{
                width: '2px',
                background: flagHover ? GOLD : `${GOLD}66`,
                boxShadow: flagHover ? `0 0 20px ${GOLD}, 0 0 40px ${GOLD}88` : 'none',
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold tracking-[0.3em] text-[#8B93A9]">
                <span
                  className="mr-2 inline-block border px-1.5 py-0.5 text-[10px] transition-all duration-300"
                  style={
                    flagHover
                      ? { background: GOLD, borderColor: GOLD, color: '#07090F', boxShadow: `0 0 12px ${GOLD}` }
                      : { background: 'transparent', borderColor: `${GOLD}55`, color: GOLD }
                  }
                >
                  {'$>'}
                </span>
                CONFESS THE FLAG
              </div>
              <div
                className="text-[9px] tracking-[0.25em]"
                style={{ color: flagHover ? GOLD : `${GOLD}77` }}
              >
                {closed ? 'SEALED' : 'AWAITING INPUT'}
              </div>
            </div>
            <div
              className="mt-4 flex items-center gap-3 border bg-black/40 px-4 py-3 transition-colors duration-300"
              style={{ borderColor: flagHover ? `${GOLD}BB` : '#232B40' }}
            >
              <span className="font-bold" style={{ color: flagHover ? GOLD : `${GOLD}77` }}>$</span>
              <input
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="BreachPoint{...}"
                disabled={closed}
                className="flex-1 bg-transparent text-[15px] tracking-[0.05em] text-[#F2F5FA] focus:outline-none placeholder-[#454C61] disabled:opacity-40"
              />
              <button
                type="submit"
                id="btn-submit-flag"
                disabled={closed || busy || !flag.trim()}
                className="shrink-0 px-5 py-2.5 text-[12px] font-bold tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all duration-300"
                style={
                  flagHover
                    ? { background: GOLD, color: '#07090F', boxShadow: `0 0 22px ${GOLD}88` }
                    : { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}55`, boxShadow: 'none' }
                }
              >
                {busy ? 'CHECKING…' : 'Hand over →'}
              </button>
            </div>
          </div>

          {closed && (
            <div className="mt-4 text-[12px] text-[#5A6379]">
              {solved ? 'Already held by your team.' : 'Skipped — this node is closed and scored zero.'}
            </div>
          )}
          {status.type !== 'idle' && (
            <div className={`mt-4 text-[13px] ${status.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'}`}>
              {status.message}
            </div>
          )}
          {status.type === 'success' && next && next.id && (
            <button
              type="button"
              onClick={() => navigateTo('CHALLENGE', next.slot)}
              className="mt-3 text-[12px] underline underline-offset-4 cursor-pointer"
              style={{ color: tone }}
            >
              Next: {next.slot} →
            </button>
          )}

          {!closed && (
            <div className="mt-6">
              {confirmSkip ? (
                <div className="border border-[#E84D7E]/40 bg-[#E84D7E]/[0.05] px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-[#C6CCDA]">
                    Skipping closes {activeChallenge.slot} for <b>zero points</b> and drops every
                    reward on Path {activeChallenge.pathId} to <b>80%</b> for the rest of the run.
                    You have <b>{skips.remaining}</b> of {skips.quota} skips left.
                  </p>
                  <div className="mt-3 flex items-center gap-5 text-[11px] tracking-[0.2em]">
                    <button onClick={() => setConfirmSkip(false)} className="text-[#A6B2C8] hover:text-[#F2F5FA] font-medium transition-colors cursor-pointer">
                      ← CANCEL
                    </button>
                    <button onClick={doSkip} disabled={busy} className="text-[#FF6B9B] hover:text-[#FFA3C0] font-bold disabled:opacity-40 transition-colors cursor-pointer">
                      SPEND A SKIP →
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSkip(true)}
                  disabled={skips.remaining <= 0}
                  className="text-[11px] tracking-[0.2em] font-semibold text-[#E84D7E] hover:text-[#FF7096] hover:brightness-125 disabled:opacity-40 disabled:hover:text-[#E84D7E] cursor-pointer border border-[#E84D7E]/40 hover:border-[#E84D7E] bg-[#E84D7E]/10 px-3.5 py-1.5 transition-all inline-block"
                >
                  {skips.remaining > 0
                    ? `SKIP CHALLENGE — ${skips.remaining}/${skips.quota} LEFT →`
                    : 'NO SKIPS REMAINING'}
                </button>
              )}
            </div>
          )}
        </form>

        {showSpinWheel && event && activeChallenge && (
          <SpinWheelModal
            eventId={event.id}
            challengeId={activeChallenge.id}
            challengeTitle={activeChallenge.title}
            isOpen={showSpinWheel}
            onClose={() => setShowSpinWheel(false)}
            onHintUnlocked={() => void refreshHints()}
          />
        )}

        {showAdminEdit && event && (
          <AdminChallengeModal
            eventId={event.id}
            challengeTitle={activeChallenge.title}
            challengeId={activeChallenge.id}
            challengeSlot={activeChallenge.slot}
            points={activeChallenge.points}
            description={activeChallenge.objective}
            onClose={() => setShowAdminEdit(false)}
            onDone={async () => {
              setShowAdminEdit(false);
              await refresh();
            }}
          />
        )}
      </div>
    </div>
  );
};

const AdminChallengeModal: React.FC<{
  eventId: string;
  challengeTitle: string;
  challengeId: string;
  challengeSlot: string;
  points: number;
  description: string;
  onClose: () => void;
  onDone: () => void;
}> = ({ eventId, challengeTitle, challengeId, challengeSlot, points: initialPoints, description: initialDesc, onClose, onDone }) => {
  const { notify } = useGame();
  const [title, setTitle] = useState(challengeTitle);
  const [description, setDescription] = useState(initialDesc);
  const [points, setPoints] = useState(String(initialPoints));
  const [newFlag, setNewFlag] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminPatchChallenge(eventId, challengeId, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        initialPoints: Number(points) || undefined,
        flag: newFlag.trim() || undefined,
      });
      notify('success', 'CHALLENGE UPDATED', `"${title}" saved.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'UPDATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full max-h-[85vh] overflow-y-auto border border-[#5ED6E3]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
          <div className="text-[11px] tracking-[0.25em] text-[#5ED6E3] font-bold font-display">
            ADMIN EDIT CHALLENGE // {challengeSlot}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono"
          >
            ESC / CLOSE ×
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] text-[#5A6379] block mb-1">TITLE</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#07090F] border border-[#1E2536] text-[#F2F5FA] px-3 py-2 text-[12px] font-mono focus:border-[#5ED6E3] outline-none"
              required
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] text-[#5A6379] block mb-1">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#07090F] border border-[#1E2536] text-[#F2F5FA] px-3 py-2 text-[12px] font-mono focus:border-[#5ED6E3] outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] text-[#5A6379] block mb-1">INITIAL POINTS</label>
              <input
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                type="number"
                className="w-full bg-[#07090F] border border-[#1E2536] text-[#F2F5FA] px-3 py-2 text-[12px] font-mono focus:border-[#5ED6E3] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] text-[#5A6379] block mb-1">UPDATE FLAG</label>
              <input
                value={newFlag}
                onChange={(e) => setNewFlag(e.target.value)}
                placeholder="Leave blank to keep"
                className="w-full bg-[#07090F] border border-[#1E2536] text-[#F2F5FA] px-3 py-2 text-[12px] font-mono focus:border-[#5ED6E3] outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40"
            >
              {busy ? 'SAVING…' : 'SAVE CHANGES →'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
