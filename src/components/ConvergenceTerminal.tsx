import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TONE } from '../data/pathsData';
import { FragmentKey, PathId } from '../types';

interface FragmentRowConfig {
  key: FragmentKey;
  label: string;
  path: PathId;
  slot: string;
  title: string;
  fallbackId: string;
  description: string;
}

const FRAGMENT_ROWS: FragmentRowConfig[] = [
  {
    key: 'who',
    label: 'WHO',
    path: 'A',
    slot: 'A10',
    title: 'The True Identity of IRIS',
    fallbackId: '73ae6a28-e5b1-4b2d-8019-d4b2e0784569',
    description: 'A single sealed identity — Meridian’s real, legal, buried name for the person behind IRIS.',
  },
  {
    key: 'how',
    label: 'HOW',
    path: 'B',
    slot: 'B10',
    title: 'The Echoed Memory',
    fallbackId: 'ce912063-6c43-4a2c-8bad-af7ef3ae5845',
    description: 'The full mechanism: moving, hiding, and persisting inside the air-gapped system.',
  },
  {
    key: 'why',
    label: 'WHY',
    path: 'C',
    slot: 'C10',
    title: 'Race or Pay',
    fallbackId: '9f41ba0a-82e0-49ac-a954-b45206e807f4',
    description: 'The seam between check and commit — ECHO was never predicting disaster, it was rehearsing it.',
  },
];

const CONVERGENCE_FALLBACK_ID = '104b05f4-9a14-40da-8f16-2ae59733d81c';
const FINAL_FLAG = 'BreachPoint{Y0U_W3R3_7H3_3XP3R1M3N75_53C0ND_R3H34R54L}';

export const ConvergenceTerminal: React.FC = () => {
  const { convergence, fragments, submitFlag, navigateTo, paths, busy } = useGame();

  // Final Convergence Flag input state
  const [flag, setFlag] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({
    type: 'idle',
    text: '',
  });

  // Per-path submission states for A10, B10, C10
  const [pathInputs, setPathInputs] = useState<Record<PathId, string>>({ A: '', B: '', C: '' });
  const [pathBusy, setPathBusy] = useState<Record<PathId, boolean>>({ A: false, B: false, C: false });
  const [pathMsg, setPathMsg] = useState<Record<PathId, { type: 'success' | 'error' | 'idle'; text: string }>>({
    A: { type: 'idle', text: '' },
    B: { type: 'idle', text: '' },
    C: { type: 'idle', text: '' },
  });

  const solved = convergence?.status === 'solved';
  const allFragmentsHeld =
    fragments.includes('who') && fragments.includes('how') && fragments.includes('why');

  // Submit final convergence flag
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    const convergenceId = convergence?.id || CONVERGENCE_FALLBACK_ID;
    if (!flag.trim() || busy) return;
    const r = await submitFlag(convergenceId, flag.trim());
    setMsg({ type: r.success ? 'success' : 'error', text: r.message });
    if (r.success) setFlag('');
  };

  // Submit individual path final challenge (A10, B10, C10)
  const handlePathSubmit = async (e: React.FormEvent, pathId: PathId, challengeId: string) => {
    e.preventDefault();
    const pathData = paths.find((p) => p.code === pathId);
    const hasEntered = Boolean(pathData?.isAttempted);
    const solvedOrSkipped = (pathData?.solved ?? 0) + (pathData?.skipped ?? 0);
    if (!hasEntered || solvedOrSkipped < 9) {
      setPathMsg((prev) => ({
        ...prev,
        [pathId]: {
          type: 'error',
          text: `You must complete all preceding challenges (1-9) in Path ${pathId} before submitting ${pathId}10. (${solvedOrSkipped}/9 completed)`,
        },
      }));
      return;
    }

    const inputFlag = pathInputs[pathId]?.trim();
    if (!inputFlag || pathBusy[pathId]) return;

    setPathBusy((prev) => ({ ...prev, [pathId]: true }));
    setPathMsg((prev) => ({ ...prev, [pathId]: { type: 'idle', text: '' } }));

    try {
      const r = await submitFlag(challengeId, inputFlag);
      setPathMsg((prev) => ({
        ...prev,
        [pathId]: { type: r.success ? 'success' : 'error', text: r.message },
      }));
      if (r.success) {
        setPathInputs((prev) => ({ ...prev, [pathId]: '' }));
      }
    } catch (err: unknown) {
      setPathMsg((prev) => ({
        ...prev,
        [pathId]: { type: 'error', text: err instanceof Error ? err.message : 'Submission failed' },
      }));
    } finally {
      setPathBusy((prev) => ({ ...prev, [pathId]: false }));
    }
  };

  const handleCopyFinalFlag = () => {
    setFlag(FINAL_FLAG);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(FINAL_FLAG).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex-1 bg-[#07090F]">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {solved ? (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#5ED6E3] font-semibold">
              ■ THE MOUTH HAS SPOKEN
            </div>
            <h1 className="mt-4 font-display font-medium uppercase tracking-wide text-5xl text-[#F2F5FA]">
              It is <span className="font-lore italic normal-case text-[#8B93A9]">finished.</span>
            </h1>
            <p className="mt-8 font-lore italic text-2xl text-[#F2F5FA] leading-relaxed">
              “You didn’t investigate the experiment. You were its second rehearsal.”
            </p>
            <div className="mt-8 flex justify-center gap-6 text-[12px] font-semibold tracking-[0.2em]">
              <button
                onClick={() => navigateTo('BOARD')}
                className="text-[#F2F5FA] border-b border-[#5ED6E3] pb-1 cursor-pointer hover:text-[#5ED6E3] transition-colors"
              >
                ROSTER →
              </button>
              <button
                onClick={() => navigateTo('MAP')}
                className="text-[#5A6379] hover:text-[#8B93A9] cursor-pointer transition-colors"
              >
                CHART →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] tracking-[0.35em] text-[#E0A83E] font-semibold">
              THE FINAL RITE // THREE TEETH, ONE MOUTH
            </div>
            <h1 className="mt-3 font-display font-medium uppercase tracking-wide text-4xl text-[#F2F5FA]">
              Lay down <span className="font-lore italic normal-case text-[#8B93A9]">all three</span>
            </h1>
            <p className="mt-2 text-[12px] text-[#8B93A9] max-w-lg mx-auto leading-relaxed">
              Submit the terminal flag for each path below. Once all three fragments are held, the final sequence will unlock to close the mouth.
            </p>

            {/* Path Final Challenges & Fragment Submissions */}
            <div className="mt-8 text-left space-y-4">
              {FRAGMENT_ROWS.map((row) => {
                const held = fragments.includes(row.key);
                const pathData = paths.find((p) => p.code === row.path);
                const challengeId = pathData?.finalChallenge?.id || row.fallbackId;
                const pathColor = TONE[row.path];
                const isPathLoading = pathBusy[row.path];
                const msgState = pathMsg[row.path];

                const hasEntered = Boolean(pathData?.isAttempted);
                const solvedOrSkipped = (pathData?.solved ?? 0) + (pathData?.skipped ?? 0);
                const requiredPreceding = 9;
                const isReady = hasEntered && solvedOrSkipped >= requiredPreceding;

                return (
                  <div
                    key={row.key}
                    className="p-5 border bg-[#0B0E16]/80 transition-all"
                    style={{
                      borderColor: held ? `${pathColor}80` : '#1E2536',
                      boxShadow: held ? `0 0 15px ${pathColor}15` : 'none',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
                          style={{
                            color: pathColor,
                            borderColor: `${pathColor}40`,
                            backgroundColor: `${pathColor}10`,
                          }}
                        >
                          {row.slot}
                        </span>
                        <div>
                          <span className="text-[12px] font-bold tracking-wider text-[#F2F5FA]">
                            {row.label} // {pathData?.name ?? `PATH ${row.path}`}
                          </span>
                          <span className="text-[11px] text-[#5A6379] ml-2 font-mono">
                            — {row.title}
                          </span>
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-mono font-bold tracking-[0.2em] px-2.5 py-0.5 rounded border"
                        style={{
                          color: held ? pathColor : isReady ? '#5ED6E3' : '#5A6379',
                          borderColor: held ? `${pathColor}60` : isReady ? '#5ED6E360' : '#1E2536',
                          backgroundColor: held ? `${pathColor}15` : isReady ? '#5ED6E315' : 'transparent',
                        }}
                      >
                        {held
                          ? '✦ HELD // VERIFIED'
                          : isReady
                          ? '● UNLOCKED // READY'
                          : !hasEntered
                          ? '○ PATH UNTOUCHED'
                          : `🔒 LOCKED (${solvedOrSkipped}/${requiredPreceding})`}
                      </span>
                    </div>

                    <p className="mt-2 text-[11.5px] text-[#8B93A9] leading-relaxed">
                      {row.description}
                    </p>

                    {/* If held: show secured state */}
                    {held ? (
                      <div className="mt-3 pt-2.5 border-t border-[#1E2536]/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#5ED6E3] flex items-center gap-1.5">
                          <span>✓</span>
                          <span>Fragment secured and loaded into the Convergence chamber.</span>
                        </span>
                        <span className="text-[#5A6379]">STATUS: 100% COMPLETE</span>
                      </div>
                    ) : !isReady ? (
                      /* If NOT ready (1-9 not complete): show sealed status with link to path trail */
                      <div className="mt-3.5 pt-3 border-t border-[#1E2536]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#07090F]/70 p-3.5 border border-[#1E2536]">
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono text-[#E84D7E] flex items-center gap-1.5 font-bold">
                            <span>🔒</span> TERMINAL SEALED // PREREQUISITES REQUIRED
                          </div>
                          <div className="text-[11px] text-[#8B93A9] font-mono">
                            {!hasEntered
                              ? `Your team has not entered Path ${row.path} yet. Complete challenges 1–9 on Path ${row.path} to submit this terminal node.`
                              : `Complete challenges 1–9 on Path ${row.path} (${solvedOrSkipped}/${requiredPreceding} completed) before submitting ${row.slot}.`}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-36 bg-[#141824] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, (solvedOrSkipped / requiredPreceding) * 100)}%`,
                                  backgroundColor: pathColor,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-[#5A6379]">
                              {solvedOrSkipped}/{requiredPreceding} COMPLETED
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateTo('TRAIL', null, row.path)}
                          className="px-3.5 py-1.5 text-[10px] font-bold tracking-[0.18em] cursor-pointer font-mono border transition-all whitespace-nowrap"
                          style={{
                            color: pathColor,
                            borderColor: `${pathColor}60`,
                            backgroundColor: `${pathColor}15`,
                          }}
                        >
                          OPEN PATH {row.path} TRAIL →
                        </button>
                      </div>
                    ) : (
                      /* If ready (1-9 complete): enable submission for 10th challenge */
                      <div className="mt-3.5 pt-3 border-t border-[#1E2536]/80">
                        <div className="text-[10px] font-mono text-[#5ED6E3] mb-2 flex items-center gap-1.5">
                          <span>✦</span> PATH {row.path} CHALLENGES 1–9 COMPLETED. SUBMIT FINAL SEAL ({row.slot}):
                        </div>
                        <form
                          onSubmit={(e) => handlePathSubmit(e, row.path, challengeId)}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                        >
                          <div className="flex-1 flex items-center gap-2 bg-[#07090F] border border-[#1E2536] px-3 py-1.5 focus-within:border-[#5ED6E3]">
                            <span className="text-[#454C61] font-mono text-[12px]">$</span>
                            <input
                              type="text"
                              value={pathInputs[row.path]}
                              onChange={(e) =>
                                setPathInputs((prev) => ({ ...prev, [row.path]: e.target.value }))
                              }
                              placeholder={`Enter ${row.slot} flag (BreachPoint{...})`}
                              className="flex-1 bg-transparent font-mono text-[12px] text-[#F2F5FA] focus:outline-none placeholder-[#3A4256]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isPathLoading || !pathInputs[row.path]?.trim()}
                            className="px-4 py-2 text-[10px] font-bold tracking-[0.18em] cursor-pointer disabled:opacity-30 transition-colors uppercase whitespace-nowrap"
                            style={{
                              backgroundColor: pathColor,
                              color: '#06232A',
                            }}
                          >
                            {isPathLoading ? 'CHECKING…' : `SUBMIT ${row.slot}`}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Path submission error/success notification */}
                    {msgState.type !== 'idle' && (
                      <div
                        className={`mt-2 text-[11px] font-mono ${
                          msgState.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'
                        }`}
                      >
                        {msgState.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Flag Reveal & Convergence Submission Section */}
            {allFragmentsHeld ? (
              <div className="mt-10 p-6 border border-[#5ED6E3]/60 bg-[#0B0E16] relative overflow-hidden shadow-[0_0_30px_rgba(94,214,227,0.1)] text-left">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#5ED6E3]/5 rounded-full pointer-events-none blur-xl" />

                <div className="text-[10px] tracking-[0.3em] font-bold text-[#5ED6E3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5ED6E3] animate-pulse" />
                  <span>ALL THREE FRAGMENTS ALIGNED // FINAL KEY SYNTHESIZED</span>
                </div>

                <p className="mt-2 text-[12px] text-[#A6B2C8] leading-relaxed">
                  The three fragments (WHO, HOW, WHY) converge into the singular final truth. Copy the decrypted sequence below and submit to close the mouth:
                </p>

                {/* Revealed Final Flag Card with One-Click Copy */}
                <div className="mt-4 p-4 border border-[#5ED6E3]/40 bg-[#07090F] rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="font-mono text-[13.5px] font-bold text-[#5ED6E3] tracking-wide select-all break-all">
                    {FINAL_FLAG}
                  </div>
                  <button
                    onClick={handleCopyFinalFlag}
                    className="px-4 py-2 bg-[#5ED6E3]/20 border border-[#5ED6E3] text-[#5ED6E3] hover:bg-[#5ED6E3] hover:text-[#07090F] text-[11px] font-bold tracking-[0.18em] cursor-pointer transition-all whitespace-nowrap text-center"
                  >
                    {copied ? '✓ COPIED!' : 'COPY & PASTE 📋'}
                  </button>
                </div>

                {/* Final Submission Form */}
                <form onSubmit={go} className="mt-6 pt-5 border-t border-[#1E2536]">
                  <div className="text-[11px] font-bold tracking-[0.2em] text-[#F2F5FA]">
                    {convergence?.title ?? 'Convergence — The Final Truth'}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#5A6379]">
                    {convergence?.objective ??
                      'Three fragments. A name, a mechanism, a purpose. Feed them in together and watch the system stop answering as three unrelated flags and start answering as one sentence.'}
                  </p>

                  <div className="mt-4 flex items-center gap-3 border-b border-[#2C3550] pb-2.5 focus-within:border-[#5ED6E3]">
                    <span className="text-[#5ED6E3] font-mono text-[14px]">$</span>
                    <input
                      id="convergence-flag"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      placeholder="Paste final flag here: BreachPoint{...}"
                      className="flex-1 bg-transparent font-mono text-[14px] text-[#F2F5FA] focus:outline-none placeholder-[#3A4256]"
                    />
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      type="submit"
                      id="btn-execute-convergence"
                      disabled={busy || !flag.trim()}
                      className="text-[13px] font-bold tracking-[0.25em] text-[#06232A] bg-[#5ED6E3] hover:bg-[#7CE3EE] disabled:opacity-30 px-10 py-3.5 transition-colors cursor-pointer shadow-[0_0_20px_rgba(94,214,227,0.25)]"
                    >
                      {busy ? 'CHECKING…' : `CLOSE THE MOUTH (+${convergence?.points ?? 500})`}
                    </button>

                    {msg.type !== 'idle' && (
                      <div
                        className={`mt-4 text-[13px] font-mono ${
                          msg.type === 'success' ? 'text-[#5ED6E3]' : 'text-[#E84D7E]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="mt-8 p-5 border border-[#1E2536] bg-[#0B0E16]/50 text-left">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[#E0A83E] font-bold">
                  <span>■ CONVERGENCE CHAMBER LOCKED</span>
                </div>
                <p className="mt-2 text-[12px] text-[#5A6379] leading-relaxed">
                  The terminal stays shut until all three fragments are in hand ({fragments.length} of 3 currently secured).
                  Submit the required flags above for any pending paths to reveal the final sequence.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
