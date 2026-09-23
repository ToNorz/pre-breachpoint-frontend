import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META } from '../services/backend';
import { TONE } from '../data/pathsData';
import { api } from '../services/api';
import { safeResourceUrl } from '../utils/safeResourceUrl';

export const ChallengeView: React.FC = () => {
  const {
    activeChallenge, navigateTo, submitFlag,
    getPathChallenges, busy,
    currentUser, event, notify, refresh,
  } = useGame();

  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [justSolved, setJustSolved] = useState(false);
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [flagHover, setFlagHover] = useState(false);

  const challengeId = activeChallenge?.id ?? null;

  // Reset per-challenge UI when navigating between nodes.
  useEffect(() => {
    setFlag('');
    setStatus({ type: 'idle', message: '' });
    setJustSolved(false);
  }, [challengeId]);

  if (!activeChallenge || !activeChallenge.id) {
    return (
      <div className="flex-1 bg-[#07090F] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-[13px] text-[#8B93A9]">
          {activeChallenge
            ? 'This node has not been revealed to your team yet.'
            : 'No challenge selected.'}
        </div>
        <button onClick={() => navigateTo('DASHBOARD')} className="text-[12px] text-[#5ED6E3] cursor-pointer">
          ← BACK TO CHALLENGES
        </button>
      </div>
    );
  }

  const tone = TONE[activeChallenge.pathId];
  const diff = DIFFICULTY_META[activeChallenge.difficulty];
  const solved = activeChallenge.status === 'solved' || justSolved;
  const closed = solved;
  const resourceUrl = safeResourceUrl(activeChallenge.resourceLink);

  // Siblings for prev/next come from the whole path so the arrows still work
  // across nodes that are revealed but not adjacent in the open set.
  const all = getPathChallenges(activeChallenge.pathId);
  const i = all.findIndex((c) => c.slot === activeChallenge.slot);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  // Fixed gold from the PRE-TRANSMISSION box (Path A amber), not the path tone.
  const GOLD = '#E0A83E';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    const r = await submitFlag(activeChallenge.id, flag);
    setStatus({ type: r.success ? 'success' : 'error', message: r.message });
    if (r.success) {
      setJustSolved(true);
      setFlag('');
    }
  };



  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex justify-between text-[11px] tracking-[0.2em] text-[#8B93A9]">
          <button
            onClick={() => navigateTo('DASHBOARD')}
            className="hover:text-[#5ED6E3] font-medium transition-colors cursor-pointer"
          >
            ← CHALLENGES
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
            <button
              onClick={() => {
                if (next) {
                  navigateTo('CHALLENGE', next.slot);
                }
              }}
              disabled={!next}
              className="disabled:opacity-30 hover:text-[#F2F5FA] cursor-pointer"
            >
              →
            </button>
          </span>
        </div>

        <div className="mt-10 text-[11px] font-semibold tracking-[0.25em]" style={{ color: tone }}>
          {activeChallenge.slot} · {activeChallenge.category}
          {solved ? ' · HELD ✓' : ''}
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
            · {activeChallenge.currentPoints} PTS
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

          {activeChallenge.maxAttempts !== null && (
            <span className="text-[#E0A83E]">· MAX {activeChallenge.maxAttempts} ATTEMPTS</span>
          )}
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[0.3em] text-[#5A6379]">
          OBJECTIVE // {activeChallenge.era} · {activeChallenge.track}
        </div>
        <p className="mt-3 text-[15px] text-[#C6CCDA] leading-[1.8] max-w-3xl whitespace-pre-line">
          {activeChallenge.objective}
        </p>

        {/* Challenge Attachment / Target Link */}
        {resourceUrl && (
          <div className="mt-5">
            <a
              href={resourceUrl}
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



        <form onSubmit={submit} className="mt-10 max-w-4xl">
          {!solved && (
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
                {solved ? 'SEALED & SCORED' : 'AWAITING INPUT'}
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
          )}

          {solved && (
            <div className="mt-4 border border-[#5ED6E3]/50 bg-[#5ED6E3]/[0.06] px-4 py-3 text-[12px] text-[#5ED6E3]">
              CHALLENGE SOLVED · FLAG ACCEPTED
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
              onClick={() => {
                navigateTo('CHALLENGE', next.slot);
              }}
              className="mt-3 text-[12px] underline underline-offset-4 cursor-pointer"
              style={{ color: tone }}
            >
              Next: {next.slot} →
            </button>
          )}


        </form>

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
