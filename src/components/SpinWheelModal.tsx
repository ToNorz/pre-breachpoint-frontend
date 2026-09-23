import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiSpinWheelResult, ApiSpinWheelStatus } from '../services/api';
import tetraWizardLogo from '../assets/images/tetraWizardLogo.png';

export interface SpinWheelModalProps {
  eventId: string;
  challengeId: string;
  challengeTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onHintUnlocked?: (hintBody: string) => void;
  companyName?: string;
  companyLogoUrl?: string;
}

interface WheelSector {
  index: number;
  segment: string;
  label: string;
  subtitle: string;
  bg: string;
  accent: string;
  icon: string;
}

const SECTORS: WheelSector[] = [
  {
    index: 0,
    segment: 'GAME_1',
    label: 'GAME-1',
    subtitle: 'Cipher Runner',
    bg: '#0C1C2E',
    accent: '#5ED6E3',
    icon: '⚡',
  },
  {
    index: 1,
    segment: 'BETTER_LUCK',
    label: 'BETTER LUCK',
    subtitle: 'Signal Lost',
    bg: '#141824',
    accent: '#8B93A9',
    icon: '◈',
  },
  {
    index: 2,
    segment: 'GAME_2',
    label: 'GAME-2',
    subtitle: 'Signal Matrix',
    bg: '#1A1236',
    accent: '#A78BFA',
    icon: '⌬',
  },
  {
    index: 3,
    segment: 'FREE_HINT',
    label: 'FREE HINT',
    subtitle: '0 PTS Decrypt',
    bg: '#281E08',
    accent: '#E0A83E',
    icon: '💡',
  },
  {
    index: 4,
    segment: 'GAME_3',
    label: 'GAME-3',
    subtitle: 'Zero Override',
    bg: '#0A261C',
    accent: '#34D399',
    icon: '⚔',
  },
  {
    index: 5,
    segment: 'FREE_SPIN',
    label: 'FREE SPIN',
    subtitle: 'Quota +1',
    bg: '#2B0E24',
    accent: '#F43F5E',
    icon: '↺',
  },
];

const HANDLE_SPIN_COLORS = [
  '#5ED6E3', // Cyan
  '#A78BFA', // Violet
  '#F43F5E', // Neon Rose / Hot Pink
  '#E0A83E', // Amber
  '#34D399', // Emerald
  '#38BDF8', // Sky Blue
  '#F472B6', // Pink
  '#FBBF24', // Gold
];

const SPIN_DURATION_MS = 4800;

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  eventId,
  challengeId,
  challengeTitle = 'Active Node',
  isOpen,
  onClose,
  onHintUnlocked,
  companyName = 'TETRA WIZARD PRESENTS',
  companyLogoUrl,
}) => {
  const [status, setStatus] = useState<ApiSpinWheelStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<ApiSpinWheelResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wheel' | 'history'>('wheel');
  const [tickActive, setTickActive] = useState(false);
  const [handleColor, setHandleColor] = useState('#5ED6E3');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentRotRef = useRef(0);
  const colorTimerRef = useRef<number | null>(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Clean up color cycling timer on unmount
  useEffect(() => {
    return () => {
      if (colorTimerRef.current) clearInterval(colorTimerRef.current);
    };
  }, []);

  // Check if current team already spun for this specific challenge
  const alreadySpun = Boolean(
    (status?.spunChallengeIds && status.spunChallengeIds.includes(challengeId)) ||
    status?.logs?.some((l) => l.challengeId === challengeId)
  );

  // Play synthetic mechanical clicks via Web Audio API
  const playClick = useCallback((freq = 520) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio not permitted or supported
    }
  }, []);

  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getSpinWheelStatus(eventId);
      setStatus(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to retrieve spin wheel data');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      void fetchStatus();
      setResult(null);
      setErrorMessage(null);
      setHandleColor('#5ED6E3');
    }
  }, [isOpen, fetchStatus]);

  const handleSpin = async () => {
    if (spinning || !eventId || !challengeId) return;

    if (alreadySpun) {
      setErrorMessage('Your team has already spun the wheel for this challenge node. Only 1 spin allowed per challenge.');
      return;
    }

    if (status && status.spinsRemaining <= 0) {
      setErrorMessage('No spins remaining! Maximum 10 spins reached for your team.');
      return;
    }

    setSpinning(true);
    setErrorMessage(null);
    setResult(null);

    // Dynamic color shifting for the handle while spinning
    let colorIdx = 0;
    if (colorTimerRef.current) clearInterval(colorTimerRef.current);
    colorTimerRef.current = window.setInterval(() => {
      colorIdx = (colorIdx + 1) % HANDLE_SPIN_COLORS.length;
      setHandleColor(HANDLE_SPIN_COLORS[colorIdx]);
    }, 110);

    // Initial mechanical rev-up sound
    playClick(440);

    try {
      const spinRes = await api.spinWheel(eventId, challengeId);

      // Math for landing precisely on spinRes.sectorIndex under top pointer (12 o'clock / 0 deg)
      // Each sector spans 60 degrees. Sector center = sectorIndex * 60 + 30.
      // Random organic offset within [-16, +16] degrees so it lands naturally inside the slice
      const randomOffset = (Math.random() - 0.5) * 32;
      const targetAngleOnWheel = spinRes.sectorIndex * 60 + 30 + randomOffset;
      let targetMod = (360 - (targetAngleOnWheel % 360)) % 360;
      if (targetMod < 0) targetMod += 360;

      // Add 6 full revolutions for dynamic momentum
      const fullSpins = 6 * 360;
      const currentMod = currentRotRef.current % 360;
      const forwardDelta = ((targetMod - currentMod) % 360 + 360) % 360;
      const totalNewRotation = currentRotRef.current + fullSpins + forwardDelta;

      currentRotRef.current = totalNewRotation;
      setRotation(totalNewRotation);

      // Audio click pulses while spinning
      let count = 0;
      const maxTicks = 22;
      const interval = setInterval(() => {
        count++;
        playClick(450 + (count % 3) * 60);
        setTickActive((prev) => !prev);
        if (count >= maxTicks) clearInterval(interval);
      }, 190);

      // Settle wheel at finish
      setTimeout(() => {
        clearInterval(interval);
        if (colorTimerRef.current) {
          clearInterval(colorTimerRef.current);
          colorTimerRef.current = null;
        }

        const winningSector = SECTORS.find((s) => s.segment === spinRes.segment);
        setHandleColor(winningSector ? winningSector.accent : '#5ED6E3');

        setSpinning(false);
        setResult(spinRes);
        playChime();

        // Update remaining spins and spun challenges locally
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                spinsUsed: spinRes.spinsUsed,
                spinsRemaining: spinRes.spinsRemaining,
                spunChallengeIds: Array.from(new Set([...(prev.spunChallengeIds || []), challengeId])),
                logs: [
                  {
                    id: spinRes.logId,
                    segment: spinRes.segment,
                    challengeId,
                    isFreeSpin: spinRes.isFreeSpin,
                    awardedData: spinRes.awarded,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev.logs,
                ],
              }
            : null
        );

        // If Free Hint was won and has hint text, notify parent
        if (spinRes.segment === 'FREE_HINT' && spinRes.awarded?.hintBody && onHintUnlocked) {
          onHintUnlocked(spinRes.awarded.hintBody);
        }
      }, SPIN_DURATION_MS);
    } catch (err: unknown) {
      if (colorTimerRef.current) {
        clearInterval(colorTimerRef.current);
        colorTimerRef.current = null;
      }
      setHandleColor('#5ED6E3');
      setSpinning(false);
      setErrorMessage(err instanceof Error ? err.message : 'Spin execution disrupted');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 select-none"
      onClick={spinning ? undefined : onClose}
      style={{ overflow: 'hidden' }}
    >
      <div
        className="w-full max-w-[580px] sm:max-w-[620px] border border-[#5ED6E3]/40 bg-[#07090F] p-4 sm:p-5 shadow-[0_0_60px_rgba(94,214,227,0.22)] relative select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ overflow: 'hidden' }}
      >
        {/* Top Header with Company Branding */}
        <div className="flex items-start justify-between border-b border-[#1E2536] pb-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5ED6E3] animate-pulse" />
              <span className="text-[10px] tracking-[0.25em] font-bold text-[#5ED6E3] font-mono uppercase">
                {companyName}
              </span>
            </div>
            <h2 className="text-[15px] sm:text-[16px] font-bold tracking-[0.15em] text-[#F2F5FA] font-display mt-0.5">
              QUANTUM WHEEL
            </h2>
            <div className="text-[9.5px] text-[#8B93A9] tracking-wider font-mono">
              TARGET NODE: <span className="text-[#E0A83E]">{challengeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <div className="text-[8px] tracking-[0.2em] text-[#8B93A9]">TEAM SPINS</div>
              <div className="text-[13px] font-bold text-[#E0A83E]">
                {status ? `${status.spinsRemaining} / ${status.totalQuota}` : '…'}
              </div>
            </div>
            {!spinning && (
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-[#8B93A9] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono border border-[#1E2536] hover:border-[#5ED6E3]/40 transition-colors"
              >
                ESC ×
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-2 border-b border-[#1E2536] pb-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('wheel')}
            className={`px-2.5 py-1 text-[9px] font-mono tracking-[0.2em] transition-colors cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-[#5ED6E3]/15 text-[#5ED6E3] border border-[#5ED6E3]/50 font-bold'
                : 'text-[#8B93A9] hover:text-[#F2F5FA]'
            }`}
          >
            ■ ROTOR MATRIX
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 text-[9px] font-mono tracking-[0.2em] transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#5ED6E3]/15 text-[#5ED6E3] border border-[#5ED6E3]/50 font-bold'
                : 'text-[#8B93A9] hover:text-[#F2F5FA]'
            }`}
          >
            ■ AUDIT TELEMETRY ({status?.logs?.length ?? 0})
          </button>
        </div>

        {errorMessage && (
          <div className="mt-1.5 p-1.5 border border-[#E84D7E]/50 bg-[#E84D7E]/10 text-[#E84D7E] text-[9.5px] font-mono flex items-center justify-between">
            <span>⚠ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#E84D7E] underline cursor-pointer text-[9px]"
            >
              DISMISS
            </button>
          </div>
        )}

        {activeTab === 'wheel' ? (
          <div className="mt-2.5 flex flex-col items-center">
            {/* Wheel Canvas & Pointer Container */}
            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center my-2.5">
              {/* Outer Glowing Ring & Tick Markers (Original color retained, only needle shifts color) */}
              <div
                className="absolute inset-0 rounded-full border-2 border-[#1E2536] shadow-[0_0_18px_rgba(30,37,54,0.35)] pointer-events-none"
              />

              {/* Top Pointer Arrow - Cybernetic Indicator Needle (NO DOT, dynamically changes color while spinning) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                <svg
                  viewBox="0 0 32 44"
                  className="w-8 h-11 transition-transform duration-100"
                  style={{
                    filter: `drop-shadow(0 0 10px ${handleColor})`,
                    transform: tickActive ? 'translateY(1.5px) scale(1.06)' : 'translateY(0) scale(1)',
                  }}
                >
                  {/* Outer needle dagger frame */}
                  <polygon
                    points="16,42 4,6 28,6"
                    fill="#07090F"
                    stroke={handleColor}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Inner luminous accent blade (NO DOT) */}
                  <polygon
                    points="16,35 8,10 24,10"
                    fill={handleColor}
                    fillOpacity={spinning ? 0.6 : 0.35}
                  />
                  {/* Center luminous cyber spine line */}
                  <line
                    x1="16"
                    y1="9"
                    x2="16"
                    y2="33"
                    stroke={handleColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </svg>
              </div>

              {/* The Rotating Wheel SVG */}
              <div
                className="w-full h-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.88, 0.25, 1)`
                    : 'none',
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full select-none overflow-visible">
                  <defs>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 6 Sectors */}
                  {SECTORS.map((sec, i) => {
                    const startAngle = i * 60;
                    const endAngle = (i + 1) * 60;
                    const startRad = ((startAngle - 90) * Math.PI) / 180;
                    const endRad = ((endAngle - 90) * Math.PI) / 180;
                    const r = 190;
                    const x1 = 200 + r * Math.cos(startRad);
                    const y1 = 200 + r * Math.sin(startRad);
                    const x2 = 200 + r * Math.cos(endRad);
                    const y2 = 200 + r * Math.sin(endRad);

                    // Midpoint for text
                    const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
                    const textR = 125;
                    const tx = 200 + textR * Math.cos(midRad);
                    const ty = 200 + textR * Math.sin(midRad);
                    const textRot = (startAngle + endAngle) / 2;

                    return (
                      <g key={sec.segment}>
                        {/* Sector Slice */}
                        <path
                          d={`M 200 200 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                          fill={sec.bg}
                          stroke="#1E2536"
                          strokeWidth="2.5"
                        />

                        {/* Outer Edge Accent Arc */}
                        <path
                          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                          fill="none"
                          stroke={sec.accent}
                          strokeWidth="3.5"
                          opacity="0.85"
                        />

                        {/* Sector Text & Icon */}
                        <g transform={`rotate(${textRot}, ${tx}, ${ty})`}>
                          <text
                            x={tx}
                            y={ty - 10}
                            textAnchor="middle"
                            fill={sec.accent}
                            fontSize="13"
                            fontWeight="bold"
                            fontFamily="monospace"
                            letterSpacing="1px"
                          >
                            {sec.label}
                          </text>
                          <text
                            x={tx}
                            y={ty + 6}
                            textAnchor="middle"
                            fill="#8B93A9"
                            fontSize="8"
                            fontFamily="monospace"
                            letterSpacing="0.5px"
                          >
                            {sec.subtitle}
                          </text>
                          <text
                            x={tx}
                            y={ty + 22}
                            textAnchor="middle"
                            fill={sec.accent}
                            fontSize="12"
                          >
                            {sec.icon}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Outer Rim Decorative Rings */}
                  <circle cx="200" cy="200" r="190" fill="none" stroke="#5ED6E3" strokeWidth="1.5" opacity="0.4" />
                  <circle cx="200" cy="200" r="195" fill="none" stroke="#1E2536" strokeWidth="1" strokeDasharray="4 6" />
                </svg>
              </div>

              {/* Center Hub — Tetra Wizard Logo Space */}
              <div className="absolute z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#5ED6E3]/80 bg-[#07090F] shadow-[0_0_25px_rgba(94,214,227,0.45)] flex flex-col items-center justify-center p-1.5 text-center select-none overflow-hidden group">
                <img
                  src={companyLogoUrl || tetraWizardLogo}
                  alt="Tetra Wizard Logo"
                  className="w-full h-full object-cover rounded-full filter drop-shadow-[0_0_8px_rgba(94,214,227,0.5)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Fixed-Height Action / Outcome Container (Strict 68px, invariant across all states to guarantee zero layout shift or scrolling) */}
            <div className="w-full h-[68px] min-h-[68px] max-h-[68px] mt-2 flex flex-col justify-center items-center overflow-hidden">
              {result ? (
                <div className="w-full h-full border border-[#E0A83E]/70 bg-[#0B0E16] px-3.5 py-1.5 flex flex-col justify-center shadow-[0_0_20px_rgba(224,168,62,0.15)] animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#1E2536] pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#E0A83E] text-[10px]">◈</span>
                      <span className="text-[10px] tracking-[0.2em] font-bold text-[#E0A83E] font-mono uppercase">
                        SPIN OUTCOME: {result.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#5ED6E3] font-mono">
                      SPINS LEFT: {result.spinsRemaining}
                    </span>
                  </div>

                  <div className="mt-1 text-[10.5px] font-mono truncate text-[#D5DBE7]">
                    {result.segment === 'FREE_HINT' && (
                      <span className="text-[#E0A83E]">
                        {result.awarded?.hintBody
                          ? `[HINT (0 PTS)]: "${result.awarded.hintBody}"`
                          : '[FREE HINT]: 0-Cost intel unlocked for this node!'}
                      </span>
                    )}

                    {result.segment === 'FREE_SPIN' && (
                      <span className="text-[#F43F5E]">
                        [BONUS FREE SPIN]: Quota preserved. You still have {result.spinsRemaining} spins left!
                      </span>
                    )}

                    {result.segment === 'BETTER_LUCK' && (
                      <span className="text-[#8B93A9]">
                        [SIGNAL DISRUPTED]: Quantum interference. Better luck on the next challenge node!
                      </span>
                    )}

                    {(result.segment === 'GAME_1' ||
                      result.segment === 'GAME_2' ||
                      result.segment === 'GAME_3') && (
                      <span className="text-[#5ED6E3]">
                        [SPECIAL MISSION // {result.label}]: {result.awarded?.message || 'Access granted. Follow telemetry.'}
                      </span>
                    )}
                  </div>
                </div>
              ) : alreadySpun ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full py-1.5 px-3 border border-[#8B93A9]/40 bg-[#141824]/60 text-center">
                    <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8B93A9]">
                      SPIN CLAIMED FOR THIS NODE (1/1)
                    </div>
                    <div className="text-[8.5px] font-mono text-[#5A6379]">
                      1 spin per challenge node limit reached. Select another node to spin.
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full text-[9.5px] font-mono text-[#8B93A9]">
                    <span>LIMIT: 1 PER NODE · 10 PER TEAM</span>
                    <span className="text-[#E0A83E]">
                      {status ? `${status.spinsRemaining} SPINS REMAINING` : '…'}
                    </span>
                  </div>
                </div>
              ) : spinning ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-5 border border-[#5ED6E3] bg-[#5ED6E3]/15 text-[#5ED6E3] font-display font-bold text-[11.5px] tracking-[0.22em] transition-all shadow-[0_0_20px_rgba(94,214,227,0.3)] flex items-center justify-center gap-2 cursor-wait"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5ED6E3] animate-ping" />
                    ROTATING QUANTUM MATRIX…
                  </button>
                  <div className="flex items-center justify-between w-full text-[9.5px] font-mono text-[#8B93A9]">
                    <span>CALIBRATING ROTOR TELEMETRY…</span>
                    <span className="font-bold font-mono text-[#5ED6E3] animate-pulse">
                      ROTATING
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-between">
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={spinning || loading || (status !== null && status.spinsRemaining <= 0)}
                    className="w-full py-2 px-5 border border-[#5ED6E3] bg-[#5ED6E3]/10 hover:bg-[#5ED6E3]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[#5ED6E3] font-display font-bold text-[11.5px] tracking-[0.22em] transition-all shadow-[0_0_15px_rgba(94,214,227,0.2)] flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5ED6E3] animate-ping" />
                    INITIATE WHEEL SPIN
                  </button>
                  <div className="flex items-center justify-between w-full text-[9.5px] font-mono text-[#8B93A9]">
                    <span>LIMIT: 1 SPIN / NODE (10 MAX / TEAM)</span>
                    <span className="text-[#E0A83E]">
                      {status ? `${status.spinsRemaining} REMAINING` : '…'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audit History Tab */
          <div className="mt-2.5 space-y-1.5 h-[390px] overflow-y-auto pr-1">
            <div className="text-[9px] tracking-[0.2em] font-mono text-[#8B93A9] mb-1">
              TEAM SPIN EVENT LEDGER (MAX 10 RECORDED):
            </div>
            {status?.logs?.length === 0 && (
              <div className="text-[11px] text-[#8B93A9] py-8 text-center font-mono border border-[#1E2536] bg-[#0B0E16]">
                No spins executed yet by your team.
              </div>
            )}
            {status?.logs?.map((log, idx) => (
              <div
                key={log.id}
                className="p-2 border border-[#1E2536] bg-[#0B0E16] flex items-center justify-between text-[10px] font-mono"
              >
                <div>
                  <span className="text-[#8B93A9] mr-2">#{status.logs.length - idx}</span>
                  <span
                    className={`font-bold ${
                      log.segment === 'FREE_HINT'
                        ? 'text-[#E0A83E]'
                        : log.segment === 'FREE_SPIN'
                        ? 'text-[#F43F5E]'
                        : log.segment === 'BETTER_LUCK'
                        ? 'text-[#8B93A9]'
                        : 'text-[#5ED6E3]'
                    }`}
                  >
                    {log.segment.replace('_', ' ')}
                  </span>
                  {log.isFreeSpin && (
                    <span className="ml-1.5 text-[8px] px-1 py-0.2 bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40">
                      FREE SPIN
                    </span>
                  )}
                </div>
                <div className="text-[#8B93A9] text-[9px]">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheelModal;
