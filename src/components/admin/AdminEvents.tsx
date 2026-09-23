import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, ApiEvent } from '../../services/api';
import { AdminNav } from './AdminNav';
import { CornerTicks } from '../LoginForm';

export const AdminEvents: React.FC = () => {
  const { notify, adminSelectedEventId, setAdminSelectedEventId, navigateTo } = useGame();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await api.listEvents());
    } catch {
      notify('error', 'LOAD FAILED', 'Could not fetch events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const deleteEvent = async (id: string) => {
    setBusy(true);
    try {
      await api.adminDeleteEvent(id);
      notify('success', 'EVENT DELETED', 'Event removed from database.');
      setConfirmDeleteId(null);
      void load();
    } catch (e: unknown) {
      notify('error', 'DELETE FAILED', e instanceof Error ? e.message : 'Could not delete event.');
    } finally {
      setBusy(false);
    }
  };

  const resetEvent = async (id: string) => {
    setBusy(true);
    try {
      await api.adminResetEvent(id);
      notify('success', 'EVENT RESET', 'All solves and submissions for this event were cleared.');
      setConfirmResetId(null);
      void load();
    } catch (e: unknown) {
      notify('error', 'RESET FAILED', e instanceof Error ? e.message : 'Could not reset event.');
    } finally {
      setBusy(false);
    }
  };

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ EVENT LIFECYCLE CONTROLLER</div>
            <h1 className="mt-1 font-display text-xl tracking-wide text-[#F2F5FA]">EVENTS ARCHIVE</h1>
            <div className="mt-1 text-[11px] text-[#5A6379]">
              Configure rules, time boundaries, slug identifiers, and event state.
            </div>
          </div>
          <button
            onClick={() => {
              setShowCreate(true);
              setEditId(null);
            }}
            className="px-5 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110"
          >
            + CREATE EVENT
          </button>
        </div>

        {loading ? (
          <div className="mt-8 text-[11px] tracking-[0.3em] text-[#5A6379]">SCANNING EVENT ARCHIVES…</div>
        ) : (
          <div className="mt-6 border border-[#1E2536] overflow-x-auto">
            <div className="grid grid-cols-[1fr_130px_110px_190px_240px] gap-3 px-4 py-2.5 border-b border-[#1E2536] text-[9px] tracking-[0.25em] text-[#5A6379] bg-[#07090F]/60">
              <span>NAME</span>
              <span>SLUG</span>
              <span>STATUS</span>
              <span>TIME WINDOW</span>
              <span className="text-right">ACTIONS</span>
            </div>
            {events.length === 0 && (
              <div className="px-4 py-8 text-[12px] text-[#5A6379] text-center">No events found.</div>
            )}
            {events.map((ev) => {
              const isSelected = adminSelectedEventId === ev.id || (!adminSelectedEventId && ev === events[0]);
              return (
                <div
                  key={ev.id}
                  className={`grid grid-cols-[1fr_130px_110px_190px_240px] gap-3 px-4 py-3.5 border-b border-[#1E2536]/60 items-center text-[12px] transition-colors ${
                    isSelected ? 'bg-[#5ED6E3]/[0.03]' : 'hover:bg-[#5ED6E3]/[0.02]'
                  }`}
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[#D5DBE7] font-semibold truncate">{ev.name}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#5ED6E3]/15 text-[#5ED6E3] border border-[#5ED6E3]/40 tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <div className="text-[10px] text-[#5A6379] truncate mt-0.5">{ev.description}</div>
                    )}
                  </div>
                  <span className="text-[#8B93A9] font-mono text-[11px] truncate">{ev.slug}</span>
                  <span className={ev.isPublished ? 'text-[#5ED6E3]' : 'text-[#5A6379]'}>
                    {ev.isPublished ? 'LIVE' : 'DRAFT'}
                    {ev.isFrozen && <span className="block text-[#E84D7E] text-[10px]">■ FROZEN</span>}
                  </span>
                  <div className="text-[#5A6379] text-[10px] space-y-0.5">
                    <div>S: {ev.startsAt ? fmtDate(ev.startsAt) : '—'}</div>
                    <div>E: {ev.endsAt ? fmtDate(ev.endsAt) : '—'}</div>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[10px]">
                    <button
                      onClick={() => {
                        setAdminSelectedEventId(ev.id);
                        navigateTo('ADMIN');
                      }}
                      className="px-2 py-1 border border-[#5ED6E3]/40 text-[#5ED6E3] hover:bg-[#5ED6E3]/10 cursor-pointer"
                    >
                      MANAGE
                    </button>
                    <button
                      onClick={() => {
                        setEditId(ev.id);
                        setShowCreate(false);
                      }}
                      className="px-2 py-1 border border-[#1E2536] text-[#D5DBE7] hover:border-[#5ED6E3] cursor-pointer"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => setConfirmResetId(ev.id)}
                      className="px-2 py-1 border border-[#E0A83E]/40 text-[#E0A83E] hover:bg-[#E0A83E]/10 cursor-pointer"
                      title="Clear solves and submissions"
                    >
                      RESET
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(ev.id)}
                      className="px-2 py-1 border border-[#E84D7E]/40 text-[#E84D7E] hover:bg-[#E84D7E]/10 cursor-pointer"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <CreateEventForm
            onDone={() => {
              setShowCreate(false);
              void load();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}
        {editId && (
          <EditEventForm
            eventId={editId}
            events={events}
            onDone={() => {
              setEditId(null);
              void load();
            }}
            onCancel={() => setEditId(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full border border-[#E84D7E]/60 bg-[#0B0E16] p-6 text-left">
              <div className="text-[10px] tracking-[0.3em] text-[#E84D7E]">CONFIRM EVENT DELETION</div>
              <h3 className="mt-2 font-display text-lg text-[#F2F5FA]">
                Permanently Delete "{events.find((e) => e.id === confirmDeleteId)?.name}"?
              </h3>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed">
                This will delete the event and all associated challenges, hints, submissions, solves, teams, and
                glitches from the database. This action is irreversible.
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
                  onClick={() => void deleteEvent(confirmDeleteId)}
                  disabled={busy}
                  className="px-5 py-2 bg-[#E84D7E] text-white text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? 'DELETING…' : 'CONFIRM DELETE'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {confirmResetId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full border border-[#E0A83E]/60 bg-[#0B0E16] p-6 text-left">
              <div className="text-[10px] tracking-[0.3em] text-[#E0A83E]">CONFIRM EVENT RESET</div>
              <h3 className="mt-2 font-display text-lg text-[#F2F5FA]">
                Clear All Activity for "{events.find((e) => e.id === confirmResetId)?.name}"?
              </h3>
              <p className="mt-2 text-[12px] text-[#8B93A9] leading-relaxed">
                This will wipe all player submissions, solves, hint unlocks, and skips for this event. Challenges,
                teams, and event configuration will be preserved.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmResetId(null)}
                  className="px-4 py-2 text-[11px] text-[#5A6379] hover:text-[#D5DBE7] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => void resetEvent(confirmResetId)}
                  disabled={busy}
                  className="px-5 py-2 bg-[#E0A83E] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? 'RESETTING…' : 'CONFIRM RESET'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const CreateEventForm: React.FC<{ onDone: () => void; onCancel: () => void }> = ({ onDone, onCancel }) => {
  const { notify } = useGame();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [busy, setBusy] = useState(false);

  const applyPreset48h = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 3600 * 1000);
    setStartsAt(toLocalInput(now.toISOString()));
    setEndsAt(toLocalInput(end.toISOString()));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.adminCreateEvent({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
      notify('success', 'EVENT CREATED', `"${name}" created successfully.`);
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
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#5ED6E3]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CornerTicks />
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2536]">
          <div className="text-[11px] tracking-[0.25em] text-[#5ED6E3] font-bold font-display">CREATE NEW EVENT</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={applyPreset48h}
              className="text-[10px] text-[#5ED6E3] border border-[#5ED6E3]/30 px-2.5 py-1 hover:bg-[#5ED6E3]/10 cursor-pointer"
            >
              PRESET: 48h LIVE WINDOW
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono"
            >
              [X]
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="EVENT NAME" value={name} onChange={setName} required placeholder="BreachPoint 2026..." />
          <Field label="SLUG (auto-slugified if blank)" value={slug} onChange={setSlug} placeholder="breachpoint-2026" />
          <Field label="STARTS AT (optional for draft)" value={startsAt} onChange={setStartsAt} type="datetime-local" />
          <Field label="ENDS AT (optional for draft)" value={endsAt} onChange={setEndsAt} type="datetime-local" />
          <div className="md:col-span-2">
            <Field label="DESCRIPTION / BRIEFING" value={description} onChange={setDescription} textarea placeholder="Lore or competition parameters..." />
          </div>
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer hover:brightness-110 disabled:opacity-40 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              {busy ? 'CREATING…' : 'INITIALIZE EVENT →'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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

const EditEventForm: React.FC<{
  eventId: string;
  events: ApiEvent[];
  onDone: () => void;
  onCancel: () => void;
}> = ({ eventId, events, onDone, onCancel }) => {
  const { notify } = useGame();
  const ev = events.find((e) => e.id === eventId);
  const [name, setName] = useState(ev?.name ?? '');
  const [slug, setSlug] = useState(ev?.slug ?? '');
  const [description, setDescription] = useState(ev?.description ?? '');
  const [startsAt, setStartsAt] = useState(ev?.startsAt ? toLocalInput(ev.startsAt) : '');
  const [endsAt, setEndsAt] = useState(ev?.endsAt ? toLocalInput(ev.endsAt) : '');
  const [busy, setBusy] = useState(false);

  if (!ev) return null;

  const setLiveNow = (hours: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 3600 * 1000);
    setStartsAt(toLocalInput(now.toISOString()));
    setEndsAt(toLocalInput(end.toISOString()));
  };

  const clearDates = () => {
    setStartsAt('');
    setEndsAt('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminPatchEvent(eventId, {
        name: name.trim() || undefined,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      notify('success', 'EVENT UPDATED', `"${name}" saved.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'UPDATE FAILED', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (field: 'isPublished' | 'isFrozen') => {
    setBusy(true);
    try {
      await api.adminPatchEvent(eventId, { [field]: !ev[field] });
      notify('success', 'EVENT UPDATED', `${field} toggled.`);
      onDone();
    } catch (err: unknown) {
      notify('error', 'TOGGLE FAILED', err instanceof Error ? err.message : 'Unknown error');
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
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E0A83E]/60 bg-[#0B0E16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CornerTicks color="#E0A83E" />
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#1E2536]">
          <div className="text-[11px] tracking-[0.25em] text-[#E0A83E] font-bold font-display">
            EDIT EVENT CONFIGURATION // {ev.name}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLiveNow(48)}
              className="text-[9px] text-[#5ED6E3] border border-[#5ED6E3]/30 px-2 py-1 hover:bg-[#5ED6E3]/10 cursor-pointer"
            >
              LIVE 48H NOW
            </button>
            <button
              type="button"
              onClick={() => setLiveNow(24)}
              className="text-[9px] text-[#5ED6E3] border border-[#5ED6E3]/30 px-2 py-1 hover:bg-[#5ED6E3]/10 cursor-pointer"
            >
              LIVE 24H NOW
            </button>
            <button
              type="button"
              onClick={clearDates}
              className="text-[9px] text-[#E84D7E] border border-[#E84D7E]/30 px-2 py-1 hover:bg-[#E84D7E]/10 cursor-pointer"
            >
              CLEAR WINDOW
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[12px] text-[#5A6379] hover:text-[#F2F5FA] px-2 py-1 cursor-pointer font-mono ml-2"
            >
              [X]
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="NAME" value={name} onChange={setName} required />
          <Field label="SLUG" value={slug} onChange={setSlug} required />
          <Field label="STARTS AT" value={startsAt} onChange={setStartsAt} type="datetime-local" />
          <Field label="ENDS AT" value={endsAt} onChange={setEndsAt} type="datetime-local" />
          <div className="md:col-span-2">
            <Field label="DESCRIPTION" value={description} onChange={setDescription} textarea />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3 mt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 bg-[#5ED6E3] text-[#06232A] text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 hover:brightness-110 shadow-[0_0_20px_rgba(94,214,227,0.2)]"
            >
              {busy ? 'SAVING…' : 'SAVE CHANGES →'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => toggle('isPublished')}
              className={`px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 ${
                ev.isPublished
                  ? 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/10'
                  : 'border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10'
              }`}
            >
              {ev.isPublished ? 'UNPUBLISH EVENT' : 'PUBLISH EVENT'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => toggle('isFrozen')}
              className={`px-5 py-2.5 border text-[11px] font-bold tracking-[0.2em] cursor-pointer disabled:opacity-40 ${
                ev.isFrozen
                  ? 'border-[#5ED6E3]/50 text-[#5ED6E3] hover:bg-[#5ED6E3]/10'
                  : 'border-[#E84D7E]/50 text-[#E84D7E] hover:bg-[#E84D7E]/10'
              }`}
            >
              {ev.isFrozen ? 'UNFREEZE BOARD' : 'FREEZE BOARD'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', required, textarea, placeholder }) => (
  <label className="block">
    <span className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full bg-[#0E1220] border border-[#1E2536] px-3 py-2 text-[12px] text-[#D5DBE7] focus:border-[#5ED6E3] outline-none resize-y min-h-[70px]"
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
