import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DIFFICULTY_META } from '../services/backend';
import { safeResourceUrl } from '../utils/safeResourceUrl';

/**
 * The welcome challenge, played inline on the dashboard.
 *
 * It belongs to no path, so it appears on no chart and no trail — and the
 * server refuses path selection until it is solved. Without somewhere to submit
 * its flag the whole event is sealed behind a gate with no handle, so the gate
 * carries its own input rather than borrowing the challenge page.
 */
export const WelcomeGate: React.FC = () => {
  const { welcome, submitFlag, busy } = useGame();
  const [flag, setFlag] = useState('');
  const resourceUrl = safeResourceUrl(welcome?.resourceLink);
  const [status, setStatus] = useState<{ type: 'idle' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  if (!welcome) return null;

  const solved = welcome.status === 'solved';
  const diff = DIFFICULTY_META[welcome.difficulty];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    const r = await submitFlag(welcome.id, flag);
    if (r.success) {
      setFlag('');
      setStatus({ type: 'idle', message: '' });
    } else {
      setStatus({ type: 'error', message: r.message });
    }
  };

  if (solved) {
    return (
      <section className="mb-4 border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.08] px-5 py-3 text-[12px] tracking-[0.15em] text-[#5ED6E3] font-semibold flex items-center gap-2">
        <span>✓</span> <span>{welcome.title.toUpperCase()} — DECODED. THE CTF IS OPEN TO YOU.</span>
      </section>
    );
  }

  return (
    <section className="mb-4 border border-[#5ED6E3]/50 bg-[#0A0D15]/90 px-5 py-4 shadow-[0_0_20px_rgba(94,214,227,0.1)]">
      <div className="text-[11px] font-bold tracking-[0.25em] text-[#5ED6E3] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5ED6E3] shadow-[0_0_6px_#5ED6E3]" />
        <span>OPEN THIS FIRST // THE CTF IS SEALED UNTIL IT FALLS</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="font-display text-lg font-bold text-[#F2F5FA]">{welcome.title}</span>
        <span
          className="text-[10.5px] font-bold tracking-[0.15em] px-2 py-0.5 border"
          style={{ color: diff.color, borderColor: `${diff.color}88` }}
        >
          {diff.label}
        </span>
        <span className="text-[12px] font-mono font-bold text-[#C6CCDA]">{welcome.currentPoints} PTS</span>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#C6CCDA] whitespace-pre-line">
        {welcome.objective}
      </p>

        {resourceUrl && (
        <div className="mt-3">
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono font-bold tracking-[0.15em] border border-[#5ED6E3]/60 bg-[#5ED6E3]/15 text-[#5ED6E3] hover:bg-[#5ED6E3]/25 transition-all cursor-pointer"
          >
            <span>
              {resourceUrl.includes('drive.google')
                ? '⬇ DOWNLOAD ATTACHMENT'
                : '↗ ACCESS CHALLENGE TARGET'}
            </span>
          </a>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 flex items-center gap-3 border-b border-[#2B354C] pb-2 focus-within:border-[#5ED6E3]">
        <span className="text-[#5ED6E3] font-bold font-mono text-[14px]">$</span>
        <input
          id="welcome-flag"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="BreachPoint{...}"
          className="flex-1 bg-transparent font-mono text-[14px] text-[#F2F5FA] focus:outline-none placeholder-[#8B93A9]"
        />
        <button
          type="submit"
          id="btn-submit-welcome"
          disabled={busy || !flag.trim()}
          className="px-4 py-1.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[11.5px] font-bold tracking-[0.2em] disabled:opacity-30 cursor-pointer transition-colors"
        >
          {busy ? 'CHECKING…' : 'DECODE →'}
        </button>
      </form>
      {status.type === 'error' && (
        <div className="mt-3 text-[13px] text-[#E84D7E]">{status.message}</div>
      )}
    </section>
  );
};
