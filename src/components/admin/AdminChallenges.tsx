import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, CreateChallengeBody, PatchChallengeBody } from '../../services/api';
import { AdminNav } from './AdminNav';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
const DIFF_COLOR: Record<string, string> = { easy: '#5ED6E3', medium: '#E0A83E', hard: '#E84D7E', expert: '#F2F5FA' };

export const AdminChallenges: React.FC = () => {
  const { notify } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await api.adminListChallenges();
      setChallenges(c);
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = challenges.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  const deleteChallenge = async (id: string) => {
    setBusy(true);
    try {
      await api.adminDeleteChallenge(id);
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
              CHALLENGES
            </h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              {challenges.length} total challenges configured
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCreate(true);
                setEditId(null);
              }}
              className="px-5 py-2 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              + CREATE CHALLENGE
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-[#0B0E16] border border-[#1E2536] p-3">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
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

        {loading ? (
          <div className="mt-6 text-[11px] tracking-[0.3em] text-[#5A6379]">SCANNING CHALLENGES…</div>
        ) : (
          <div className="mt-4 border border-[#1E2536] overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1E2536] text-[9px] tracking-[0.2em] text-[#5A6379] bg-[#07090F]/50">
                  <th className="px-4 py-2.5 text-left">TITLE</th>
                  <th className="px-3 py-2.5 text-left">DIFF</th>
                  <th className="px-3 py-2.5 text-right">POINTS</th>
                  <th className="px-4 py-2.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#1E2536]/40 hover:bg-[#5ED6E3]/[0.02]">
                    <td className="px-4 py-2.5 text-[#D5DBE7] max-w-[260px] truncate font-medium">
                      {c.title}
                    </td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: DIFF_COLOR[c.difficulty] }}>
                      {c.difficulty.toUpperCase()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#D5DBE7] font-mono">
                      {c.points}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditId(c.id);
                            setShowCreate(false);
                          }}
                          className="px-2 py-1 border border-[#1E2536] text-[10px] text-[#5ED6E3] hover:border-[#5ED6E3] cursor-pointer"
                        >
                          EDIT
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
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-[#5A6379]">No challenges matching criteria.</div>
            )}
          </div>
        )}

        {showCreate && (
          <CreateChallengeForm
            onDone={() => {
              setShowCreate(false);
              void load();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}
        {editId && (
          <EditChallengeForm
            challenge={challenges.find((c) => c.id === editId)!}
            onDone={() => {
              setEditId(null);
              void load();
            }}
            onCancel={() => setEditId(null)}
          />
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative max-w-md w-full border border-[#E84D7E]/60 bg-[#0B0E16] p-6 text-left">
              <div className="text-[10px] tracking-[0.3em] text-[#E84D7E]">CONFIRM CHALLENGE DELETION</div>
              <h3 className="mt-2 font-display text-lg text-[#F2F5FA]">
                Delete "{challenges.find((c) => c.id === confirmDeleteId)?.title}"?
              </h3>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed">
                This will delete the challenge, its flag definition, and any player submissions or solves
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
  onDone: () => void;
  onCancel: () => void;
}> = ({ onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<CreateChallengeBody>({
    title: '',
    description: '',
    difficulty: 'easy',
    points: 250,
    flag: '',
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
      await api.adminCreateChallenge(form);
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
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="TITLE" value={form.title} onChange={(v) => set('title', v)} required className="md:col-span-2" />
          <Field label="DESCRIPTION" value={form.description} onChange={(v) => set('description', v)} textarea className="md:col-span-2" />
          <Select
            label="DIFFICULTY"
            value={form.difficulty}
            onChange={(v) => set('difficulty', v as CreateChallengeBody['difficulty'])}
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))}
          />
          <Field label="POINTS" value={String(form.points)} onChange={(v) => set('points', Number(v))} type="number" />
          <Field label="FLAG (plaintext)" value={form.flag} onChange={(v) => set('flag', v)} required className="md:col-span-2" placeholder="FLAG{...}" />
          <div className="md:col-span-2 flex gap-3 mt-2">
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
  challenge: AdminChallenge;
  onDone: () => void;
  onCancel: () => void;
}> = ({ challenge: c, onDone, onCancel }) => {
  const { notify } = useGame();
  const [form, setForm] = useState<PatchChallengeBody>({
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    points: c.points,
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
      await api.adminPatchChallenge(c.id, body);
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
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="TITLE" value={form.title ?? ''} onChange={(v) => set('title', v)} className="md:col-span-2" />
          <Field label="DESCRIPTION" value={form.description ?? ''} onChange={(v) => set('description', v)} textarea className="md:col-span-2" />
          <Select
            label="DIFFICULTY"
            value={form.difficulty ?? c.difficulty}
            onChange={(v) => set('difficulty', v as PatchChallengeBody['difficulty'])}
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.toUpperCase() }))}
          />
          <Field label="POINTS" value={String(form.points ?? '')} onChange={(v) => set('points', Number(v))} type="number" />
          <Field label="NEW FLAG (leave blank to keep current)" value={newFlag} onChange={setNewFlag} className="md:col-span-2" placeholder="FLAG{new_flag_here}" />
          <div className="md:col-span-2 flex gap-3 mt-2">
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
