import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, AdminHint, CreateChallengeBody, PatchChallengeBody } from '../../services/api';
import { AdminNav } from './AdminNav';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
const STATES = ['hidden', 'visible', 'locked'] as const;
const DIFF_COLOR: Record<string, string> = { easy: '#5ED6E3', medium: '#E0A83E', hard: '#E84D7E', expert: '#F2F5FA' };
const STATE_COLOR: Record<string, string> = { visible: '#5ED6E3', hidden: '#5A6379', locked: '#E84D7E' };

const TITLE_TO_PATH_SLOT: Record<string, string> = {
  // Path A
  'ashes don’t lie!': 'A1',
  'ashes don\'t lie!': 'A1',
  'the budget that doesn\'t add up': 'A2',
  'the budget that doesn’t add up': 'A2',
  'the blind spot: iris network log': 'A3',
  'the blind spot': 'A3',
  'out of order': 'A4',
  'ask the bridge': 'A5',
  'the archive that remembers too much': 'A6',
  'the archive remembers': 'A7',
  'the depot terminal': 'A8',
  'the medium that wasn\'t supposed to survive': 'A9',
  'the medium that wasn’t supposed to survive': 'A9',
  'the true identity of iris': 'A10',
  'the sealed personnel file': 'A10',

  // Path B
  'the noise nobody checked': 'B1',
  'echo recover': 'B2',
  'the 2015 incident breach': 'B3',
  'the altered manifest': 'B4',
  'chronos drift': 'B5',
  'the cutter transmission': 'B6',
  'quiet host': 'B7',
  'behind the mirror': 'B8',
  'follow the name': 'B9',
  'find beatriz': 'B9',
  'the echoed memory': 'B10',
  'caught live': 'B10',

  // Path C
  'core initialization routine': 'C1',
  'the training data exploits': 'C2',
  'git ignore': 'C3',
  'residual index': 'C4',
  'the eerie forecast': 'C5',
  'inference pipeline: memory ingestion': 'C6',
  'the 404 moment': 'C7',
  'a point in the storm': 'C8',
  'the forgotten forecast': 'C9',
  'race or pay': 'C10',
  'between check and commit': 'C10',

  // Standalone
  'transmission zero': 'START',
  'convergence — the final truth': 'FINAL',
  'convergence': 'FINAL',
};

export const getChallengeSlot = (c: AdminChallenge): string => {
  if (c.slot) return c.slot.toUpperCase();
  if (c.pathCode && c.sequence) return `${c.pathCode}${c.sequence}`.toUpperCase();
  const normalized = c.title.trim().toLowerCase();
  return TITLE_TO_PATH_SLOT[normalized] ?? '—';
};

export const getPathBadgeStyle = (slot: string) => {
  const upper = slot.toUpperCase();
  if (upper.startsWith('A')) {
    return 'bg-[#5ED6E3]/15 text-[#5ED6E3] border-[#5ED6E3]/50';
  }
  if (upper.startsWith('B')) {
    return 'bg-[#E84D7E]/15 text-[#E84D7E] border-[#E84D7E]/50';
  }
  if (upper.startsWith('C')) {
    return 'bg-[#E0A83E]/15 text-[#E0A83E] border-[#E0A83E]/50';
  }
  if (upper === 'FINAL' || upper === 'ECHO' || upper === 'CONVERGENCE') {
    return 'bg-[#B78AF7]/20 text-[#B78AF7] border-[#B78AF7]/60 shadow-[0_0_8px_rgba(183,138,247,0.3)]';
  }
  if (upper === 'START' || upper === 'WELCOME' || upper === 'W0') {
    return 'bg-[#5ED6E3]/20 text-[#5ED6E3] border-[#5ED6E3]/60';
  }
  return 'bg-[#8B93A9]/15 text-[#D5DBE7] border-[#8B93A9]/40';
};

export const slotOrder = (slot: string): number => {
  const upper = slot.toUpperCase();
  if (upper === 'START' || upper === 'W0') return 1;
  if (upper.startsWith('A')) return 100 + parseInt(upper.replace(/\D/g, '') || '0', 10);
  if (upper.startsWith('B')) return 200 + parseInt(upper.replace(/\D/g, '') || '0', 10);
  if (upper.startsWith('C')) return 300 + parseInt(upper.replace(/\D/g, '') || '0', 10);
  if (upper === 'FINAL' || upper === 'ECHO' || upper === 'CONVERGENCE') return 999;
  return 500;
};

export const AdminChallenges: React.FC = () => {
  const { adminEvent, notify } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hintsFor, setHintsFor] = useState<string | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [pathFilter, setPathFilter] = useState<'all' | 'A' | 'B' | 'C' | 'STANDALONE'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!adminEvent) return;
    setLoading(true);
    try {
      const [c, cats] = await Promise.all([
        api.adminListChallenges(adminEvent.id),
        api.listCategories(),
      ]);
      setChallenges(c);
      setCategories(cats);
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [adminEvent]);

  const filtered = challenges
    .filter((c) => {
      const slot = getChallengeSlot(c);
      // State filter
      if (filter !== 'all' && c.state !== filter) return false;
      // Path filter
      if (pathFilter === 'A' && !slot.startsWith('A')) return false;
      if (
        pathFilter === 'STANDALONE' &&
        slot.startsWith('A')
      )
        return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSlot = slot.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchCat = catName(c.categoryId).toLowerCase().includes(q);
        if (!matchSlot && !matchTitle && !matchCat) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const slotA = getChallengeSlot(a);
      const slotB = getChallengeSlot(b);
      return slotOrder(slotA) - slotOrder(slotB);
    });

  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? `#${id}`;

  const quickState = async (id: string, state: AdminChallenge['state']) => {
    if (!adminEvent) return;
    try {
      await api.adminPatchChallenge(adminEvent.id, id, { state });
      notify('success', 'UPDATED', `State set to ${state}.`);
      void load();
    } catch (err: unknown) {
      notify('error', 'FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteChallenge = async (id: string) => {
    if (!adminEvent) return;
    setBusy(true);
    try {
      await api.adminDeleteChallenge(adminEvent.id, id);
      notify('success', 'CHALLENGE DELETED', 'Challenge permanently removed.');
      setConfirmDeleteId(null);
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="scan-faint max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ CHALLENGE ARCHIVE</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">
              CHALLENGES {adminEvent ? `— ${adminEvent.name}` : ''}
            </h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              {challenges.length} total challenges configured
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCats(!showCats)}
              className="px-4 py-2 border border-[#1E2536] text-[11px] tracking-[0.18em] text-[#8B93A9] hover:text-[#D5DBE7] cursor-pointer"
            >
              CATEGORIES ({categories.length})
            </button>
            <button
              onClick={() => {
                setShowCreate(true);
                setEditId(null);
                setHintsFor(null);
              }}
              className="px-5 py-2 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              + CREATE CHALLENGE
            </button>
          </div>
        </div>

        {showCats && (
          <CategoryManager
            categories={categories}
            onDone={() => {
              setShowCats(false);
              void load();
            }}
          />
        )}

        {/* Path Filter Tabs & Search Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-[#0B0E16] border border-[#1E2536] p-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] tracking-[0.25em] text-[#5A6379] mr-1">PATH:</span>
            {(['all', 'A', 'STANDALONE'] as const).map((p) => {
              const label = p === 'all' ? 'ALL' : p === 'STANDALONE' ? 'SPECIAL' : `PATH ${p}`;
              const count =
                p === 'all'
                  ? challenges.length
                  : p === 'STANDALONE'
                  ? challenges.filter((c) => !getChallengeSlot(c).startsWith('A')).length
                  : challenges.filter((c) => getChallengeSlot(c).startsWith(p)).length;
              return (
                <button
                  key={p}
                  onClick={() => setPathFilter(p)}
                  className={`px-3 py-1 text-[10px] tracking-[0.15em] font-bold transition-all cursor-pointer rounded border ${
                    pathFilter === p
                      ? p === 'A'
                        ? 'bg-[#5ED6E3]/20 text-[#5ED6E3] border-[#5ED6E3]'
                        : 'bg-[#B78AF7]/20 text-[#B78AF7] border-[#B78AF7]'
                      : 'bg-transparent text-[#5A6379] border-transparent hover:text-[#8B93A9]'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by path (e.g. A1) or title..."
              className="w-full bg-[#07090F] border border-[#1E2536] px-3 py-1.5 text-[11px] text-[#D5DBE7] placeholder-[#454C61] focus:border-[#5ED6E3] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-[11px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* State Filter Tabs */}
        <div className="mt-3 flex gap-2">
          {['all', ...STATES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.18em] cursor-pointer ${
                filter === s ? 'text-[#E0A83E] border-b border-[#E0A83E]' : 'text-[#5A6379]'
              }`}
            >
              {s.toUpperCase()}{' '}
              {s === 'all'
                ? `(${challenges.length})`
                : `(${challenges.filter((c) => c.state === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#5A6379]">SCANNING CHALLENGES…</div>
        ) : !adminEvent ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#E84D7E]">NO EVENT SELECTED</div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/50">
                  <th className="px-3 py-2.5 text-left w-20">PATH</th>
                  <th className="px-4 py-2.5 text-left">TITLE</th>
                  <th className="px-3 py-2.5 text-left">CATEGORY</th>
                  <th className="px-3 py-2.5 text-left">DIFF</th>
                  <th className="px-3 py-2.5 text-right">PTS (INIT/MIN)</th>
                  <th className="px-3 py-2.5 text-left">STATE</th>
                  <th className="px-4 py-2.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const slot = getChallengeSlot(c);
                  return (
                    <tr key={c.id} className="border-b border-[#1E2536]/40 hover:bg-[#5ED6E3]/[0.02]">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10.5px] font-mono font-bold tracking-wider rounded border ${getPathBadgeStyle(
                            slot
                          )}`}
                        >
                          {slot}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#D5DBE7] max-w-[260px] truncate font-medium">
                        {c.title}
                      </td>
                      <td className="px-3 py-2.5 text-[#8B93A9]">{catName(c.categoryId)}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: DIFF_COLOR[c.difficulty] }}>
                        {c.difficulty.toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#D5DBE7] font-mono">
                        {c.initialPoints} / {c.minPoints}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={c.state}
                          onChange={(e) => quickState(c.id, e.target.value as AdminChallenge['state'])}
                          className="bg-[#0E1220] border border-[#1E2536] px-2 py-1 text-[10px] cursor-pointer outline-none"
                          style={{ color: STATE_COLOR[c.state] }}
                        >
                          {STATES.map((s) => (
                            <option key={s} value={s}>
                              {s.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditId(c.id);
                              setShowCreate(false);
                              setHintsFor(null);
                            }}
                            className="px-2 py-1 border border-[#1E2536] text-[10px] text-[#5ED6E3] hover:border-[#5ED6E3] cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => {
                              setHintsFor(c.id);
                              setEditId(null);
                              setShowCreate(false);
                            }}
                            className="px-2 py-1 border border-[#1E2536] text-[10px] text-[#E0A83E] hover:border-[#E0A83E] cursor-pointer"
                          >
                            HINTS
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="px-2 py-1 border border-[#E84D7E]/40 text-[10px] text-[#E84D7E] hover:bg-[#E84D7E]/10 cursor-pointer"
                          >
                            DEL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-[#5A6379]">No challenges matching criteria.</div>
            )}
          </div>
        )}

        {showCreate && adminEvent && (
          <CreateChallengeForm
            eventId={adminEvent.id}
            categories={categories}
            onDone={() => {
              setShowCreate(false);
              void load();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}
        {editId && adminEvent && (
          <EditChallengeForm
            eventId={adminEvent.id}
            challenge={challenges.find((c) => c.id === editId)!}
            categories={categories}
            onDone={() => {
              setEditId(null);
              void load();
            }}
            onCancel={() => setEditId(null)}
          />
        )}
        {hintsFor && adminEvent && (
          <HintManager
            eventId={adminEvent.id}
            challengeId={hintsFor}
            challengeTitle={challenges.find((c) => c.id === hintsFor)?.title ?? '—'}
            challengeSlot={
              challenges.find((c) => c.id === hintsFor)
                ? getChallengeSlot(challenges.find((c) => c.id === hintsFor)!)
                : undefined
            }
            onClose={() => setHintsFor(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative max-w-md w-full border border-[#E84D7E]/60 bg-[#0B0E16] p-6 text-left">
              <div className="text-[10px] tracking-[0.3em] text-[#E84D7E]">CONFIRM CHALLENGE DELETION</div>
              <h3 className="mt-2 font-display text-lg text-[#F2F5FA]">
                Delete "{challenges.find((c) => c.id === confirmDeleteId)?.title}"?
              </h3>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed">
                This will delete the challenge, its flag definition, hints, and any player submissions or solves
                recorded for this challenge.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-[11px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => void deleteChallenge(confirmDeleteId)}
                  disabled={busy}
                  className="px-5 py-2 bg-[#E84D7E] text-white text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? 'DELETING…' : 'CONFIRM DELETE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', required, textarea, className, placeholder }) => (
  <label className={`block ${className ?? ''}`}>
    <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none resize-y min-h-[60px]"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none"
      />
    )}
  </label>
);

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ label, value, onChange, options, className }) => (
  <label className={`block ${className ?? ''}`}>
    <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

const CreateChallengeForm: React.FC<{
  eventId: string;
  categories: { id: number; name: string }[];
  onDone: () => void;
  onCancel: () => void;
}> = ({ eventId, categories, onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<CreateChallengeBody>({
    title: '',
    description: '',
    categoryId: categories[0]?.id ?? 1,
    difficulty: 'easy',
    initialPoints: 500,
    minPoints: 100,
    flag: '',
    decayType: 'logarithmic',
    decayThreshold: 25,
    author: '',
    resourceLink: '',
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CreateChallengeBody>(k: K, v: CreateChallengeBody[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.flag.trim()) {
      notify('error', 'VALIDATION ERROR', 'Title and Flag are required.');
      return;
    }
    setBusy(true);
    try {
      await api.adminCreateChallenge(eventId, form);
      notify('success', 'CHALLENGE CREATED', `"${form.title}" created successfully.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#5ED6E3]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
          <div className="text-[11px] tracking-[0.25em] text-[#5ED6E3] font-bold font-display">
            CREATE NEW CHALLENGE
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono"
          >
            [X]
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="TITLE" value={form.title} onChange={(v) => set('title', v)} required className="md:col-span-2" />
          <Select
            label="CATEGORY"
            value={String(form.categoryId)}
            onChange={(v) => set('categoryId', Number(v))}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <Field label="DESCRIPTION" value={form.description} onChange={(v) => set('description', v)} textarea className="md:col-span-3" />
          <Select
            label="DIFFICULTY"
            value={form.difficulty}
            onChange={(v) => set('difficulty', v as CreateChallengeBody['difficulty'])}
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))}
          />
          <Field label="INITIAL POINTS" value={String(form.initialPoints)} onChange={(v) => set('initialPoints', Number(v))} type="number" />
          <Field label="MIN POINTS" value={String(form.minPoints)} onChange={(v) => set('minPoints', Number(v))} type="number" />
          <Field label="FLAG (plaintext)" value={form.flag} onChange={(v) => set('flag', v)} required className="md:col-span-2" placeholder="FLAG{...}" />
          <Field label="MAX ATTEMPTS (blank = unlimited)" value={form.maxAttempts != null ? String(form.maxAttempts) : ''} onChange={(v) => set('maxAttempts', v ? Number(v) : undefined)} type="number" />
          <Field label="AUTHOR" value={form.author ?? ''} onChange={(v) => set('author', v)} />
          <Field label="RESOURCE / FILE LINK" value={form.resourceLink ?? ''} onChange={(v) => set('resourceLink', v)} className="md:col-span-2" placeholder="https://..." />
          <div className="md:col-span-3 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              {busy ? 'CREATING…' : 'CREATE CHALLENGE →'}
            </button>
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer">
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditChallengeForm: React.FC<{
  eventId: string;
  challenge: AdminChallenge;
  categories: { id: number; name: string }[];
  onDone: () => void;
  onCancel: () => void;
}> = ({ eventId, challenge: c, categories, onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<PatchChallengeBody>({
    title: c.title,
    description: c.description,
    categoryId: c.categoryId,
    difficulty: c.difficulty,
    initialPoints: c.initialPoints,
    minPoints: c.minPoints,
    state: c.state,
    maxAttempts: c.maxAttempts,
    author: c.author ?? '',
    decayThreshold: c.decayThreshold ?? 25,
    decayType: c.decayType ?? 'logarithmic',
  });
  const [newFlag, setNewFlag] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PatchChallengeBody>(k: K, v: PatchChallengeBody[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body: PatchChallengeBody = { ...form };
      if (newFlag.trim()) body.flag = newFlag.trim();
      await api.adminPatchChallenge(eventId, c.id, body);
      notify('success', 'UPDATED', `"${form.title}" saved.`);
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
      onClick={onCancel}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E0A83E]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2 py-0.5 text-[10.5px] font-mono font-bold tracking-wider rounded border ${getPathBadgeStyle(
                getChallengeSlot(c)
              )}`}
            >
              {getChallengeSlot(c)}
            </span>
            <div className="text-[11px] tracking-[0.25em] text-[#E0A83E] font-bold font-display">
              EDIT CHALLENGE // {c.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono"
          >
            [X]
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="TITLE" value={form.title ?? ''} onChange={(v) => set('title', v)} className="md:col-span-2" />
          <Select
            label="CATEGORY"
            value={String(form.categoryId)}
            onChange={(v) => set('categoryId', Number(v))}
            options={categories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
          />
          <Field label="DESCRIPTION" value={form.description ?? ''} onChange={(v) => set('description', v)} textarea className="md:col-span-3" />
          <Select
            label="DIFFICULTY"
            value={form.difficulty ?? c.difficulty}
            onChange={(v) => set('difficulty', v as PatchChallengeBody['difficulty'])}
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))}
          />
          <Field label="INITIAL POINTS" value={String(form.initialPoints ?? '')} onChange={(v) => set('initialPoints', Number(v))} type="number" />
          <Field label="MIN POINTS" value={String(form.minPoints ?? '')} onChange={(v) => set('minPoints', Number(v))} type="number" />
          <Select
            label="STATE"
            value={form.state ?? c.state}
            onChange={(v) => set('state', v as PatchChallengeBody['state'])}
            options={STATES.map((s) => ({ value: s, label: s.toUpperCase() }))}
          />
          <Field label="NEW FLAG (leave blank to keep current)" value={newFlag} onChange={setNewFlag} className="md:col-span-2" placeholder="FLAG{new_flag_here}" />
          <Field label="MAX ATTEMPTS" value={form.maxAttempts != null ? String(form.maxAttempts) : ''} onChange={(v) => set('maxAttempts', v ? Number(v) : null)} type="number" />
          <Field label="AUTHOR" value={form.author ?? ''} onChange={(v) => set('author', v)} />
          <Field label="RESOURCE LINK" value={form.resourceLink ?? ''} onChange={(v) => set('resourceLink', v)} />
          <div className="md:col-span-3 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              {busy ? 'SAVING…' : 'SAVE CHANGES →'}
            </button>
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[11px] tracking-[0.2em] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer">
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HintManager: React.FC<{
  eventId: string;
  challengeId: string;
  challengeTitle: string;
  challengeSlot?: string;
  onClose: () => void;
}> = ({ eventId, challengeId, challengeTitle, challengeSlot, onClose }) => {
  const { notify } = useGame();
  const [hints, setHints] = useState<AdminHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [cost, setCost] = useState('0');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setHints(await api.adminListHints(eventId, challengeId));
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch hints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [eventId, challengeId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateHint(eventId, challengeId, { body: body.trim(), cost: Number(cost) || 0 });
      notify('success', 'HINT CREATED', 'Hint added.');
      setBody('');
      setCost('0');
      void load();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (hintId: string) => {
    try {
      await api.adminDeleteHint(eventId, challengeId, hintId);
      notify('success', 'HINT DELETED', 'Hint removed.');
      void load();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E0A83E]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
          <div className="flex items-center gap-2.5">
            {challengeSlot && (
              <span
                className={`px-2 py-0.5 text-[10.5px] font-mono font-bold tracking-wider rounded border ${getPathBadgeStyle(
                  challengeSlot
                )}`}
              >
                {challengeSlot}
              </span>
            )}
            <div className="text-[11px] tracking-[0.25em] text-[#E0A83E] font-bold font-display">
              HINTS MANAGEMENT // {challengeTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-[#5A6379] hover:text-[#D5DBE7] px-2 py-1 cursor-pointer font-mono"
          >
            [X]
          </button>
        </div>
        {loading ? (
          <div className="mt-4 text-[11px] text-[#5A6379]">LOADING HINTS…</div>
        ) : (
          <div className="mt-4 space-y-3">
            {hints.length === 0 && <div className="text-[11px] text-[#5A6379]">No hints added yet for this challenge.</div>}
            {hints.map((h) => (
              <div key={h.id} className="flex items-start justify-between border-b border-[#1E2536]/40 py-2.5">
                <div>
                  <div className="text-[12px] text-[#D5DBE7]">{h.body}</div>
                  <div className="text-[10px] text-[#5A6379] mt-0.5">
                    COST: <span className="text-[#5ED6E3]">{h.cost} PTS</span> · SORT ORDER: {h.sortOrder}
                  </div>
                </div>
                <button
                  onClick={() => remove(h.id)}
                  className="text-[10px] text-[#E84D7E] hover:text-[#F2F5FA] cursor-pointer ml-3 shrink-0"
                >
                  DELETE
                </button>
              </div>
            ))}
            <form onSubmit={create} className="mt-4 flex gap-3 items-end">
              <Field label="NEW HINT CONTENT" value={body} onChange={setBody} required className="flex-1" />
              <Field label="COST (PTS)" value={cost} onChange={setCost} type="number" className="w-24" />
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 bg-[#5ED6E3] text-[#06232A] text-[10px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 mb-0.5 hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
              >
                ADD HINT
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryManager: React.FC<{
  categories: { id: number; name: string }[];
  onDone: () => void;
}> = ({ categories, onDone }) => {
  const { notify } = useGame();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateCategory(name.trim());
      notify('success', 'CATEGORY CREATED', `"${name}" created.`);
      setName('');
      onDone();
    } catch (err: unknown) {
      notify('error', 'CREATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api.adminDeleteCategory(id);
      notify('success', 'DELETED', 'Category removed.');
      onDone();
    } catch (err: unknown) {
      notify('error', 'DELETE FAILED', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="mt-4 border border-[#1E2536] bg-[#0B0E16]/70 p-5">
      <div className="text-[10px] tracking-[0.25em] text-[#5A6379]">EVENT CATEGORIES</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c.id} className="flex items-center gap-2 border border-[#1E2536] bg-[#0E1220] px-3 py-1.5 text-[11px] text-[#D5DBE7]">
            {c.name}
            <button onClick={() => remove(c.id)} className="text-[#E84D7E] hover:text-[#F2F5FA] cursor-pointer font-bold">
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={create} className="mt-4 flex gap-3 items-end max-w-md">
        <Field label="NEW CATEGORY NAME" value={name} onChange={setName} required className="flex-1" />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 bg-[#5ED6E3] text-[#06232A] text-[10px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 mb-0.5 hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
        >
          ADD
        </button>
      </form>
    </div>
  );
};
