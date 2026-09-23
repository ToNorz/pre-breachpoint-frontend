import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ApiBoard,
  ApiError,
  ApiEvent,
  ApiTeam,
  AuthUser,
  EVENT_SLUG,
  NetworkError,
  api,
  getToken,
  setToken,
} from '../services/api';
import {
  boardChallenges,
  challengesForPath,
  pathStates,
  setCategoryNames,
  toScoreboard,
  welcomeChallenge,
} from '../services/backend';
import {
  Challenge,
  PathId,
  PathState,
  StandaloneChallenge,
  TeamScore,
  ViewType,
} from '../types';
import { ParsedRoute, parseHash, viewToHash } from '../utils/router';
import { isPathId } from '../data/pathsData';
import { soundFx } from '../utils/audio';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  points?: number;
  pathId?: PathId;
}

/** Uniform shape for every action a component can trigger. */
export interface ActionResult {
  success: boolean;
  message: string;
  points?: number;
  pathId?: PathId;
}

/**
 * Where the app is in its boot sequence. Each phase renders a different shell,
 * and they are mostly ordered: you cannot have a team before a session, or a
 * board before a team.
 *
 * `pending` and `ended` sit outside that order. They are the event's own
 * window, not the player's progress through boot: the server refuses every
 * scoring action outside it, so the client must render a lobby and a closing
 * board rather than surfacing a 403 as a broken app.
 */
export type Phase =
  | 'loading'
  | 'unauthenticated'
  | 'pending'
  | 'no-team'
  | 'ready'
  | 'ended'
  | 'error';

export type EventWindow = 'pending' | 'running' | 'ended';

/**
 * Where `now` falls relative to the event's window.
 *
 * An event with no dates cannot be published (the schema enforces it), so a
 * missing date here means an unpublished event, which is treated as running —
 * the server is the authority and will refuse anything it should.
 */
export function eventWindow(
  event: { startsAt: string | null; endsAt: string | null } | null,
  now: number,
): EventWindow {
  if (!event) return 'running';
  if (event.startsAt && now < new Date(event.startsAt).getTime()) return 'pending';
  if (event.endsAt && now > new Date(event.endsAt).getTime()) return 'ended';
  return 'running';
}

interface GameContextType {
  phase: Phase;
  bootError: string | null;
  busy: boolean;
  retryBoot: () => void;

  // Session
  currentUser: AuthUser | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  signup: (username: string, email: string, password: string) => Promise<ActionResult>;
  logout: () => void;

  // Event + team
  event: ApiEvent | null;
  adminEvent: ApiEvent | null;
  allEvents: ApiEvent[];
  adminSelectedEventId: string | null;
  setAdminSelectedEventId: (id: string | null) => void;
  window: EventWindow;
  /** ms until the event opens (pending) or closes (running). Null when ended. */
  windowMs: number | null;
  team: ApiTeam | null;
  teamName: string;
  refreshTeam: () => Promise<void>;
  createTeam: (name: string) => Promise<ActionResult>;
  joinTeam: (name: string, joinCode: string) => Promise<ActionResult>;

  // Server state
  board: ApiBoard | null;
  refresh: () => Promise<void>;
  paths: PathState[];
  chosenPath: PathId | null;
  getPathChallenges: (path: PathId) => Challenge[];
  visibleChallenges: Challenge[];
  activeChallenge: Challenge | null;
  activeChallengeId: string | null;
  solvedSlots: string[];
  score: number;
  rank: number | null;
  pathScores: { pathA: number; total: number };
  welcome: StandaloneChallenge | null;
  formattedTimer: string;
  glitchEndsAt: number | null;
  glitchLabel: string | null;
  /** Real decayed-vs-restored values for the glitch takeover to animate. */
  glitchSample: {
    initial: number;
    current: number;
    original: number;
    decayed: number;
    slot?: string;
    title?: string;
  };

  // Actions
  choosePath: (path: PathId) => Promise<ActionResult>;
  submitFlag: (challengeId: string, flag: string) => Promise<ActionResult>;
  scoreboard: TeamScore[];
  scoreboardFrozen: boolean;
  loadScoreboard: () => Promise<void>;

  // UI
  currentView: ViewType;
  navigateTo: (view: ViewType, slot?: string | null) => void;
  toast: ToastNotification | null;
  notify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  dismissToast: () => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/** How often the board is re-read while the player sits on a page. */
const BOARD_POLL_MS = 5_000;

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};

/**
 * The server refusing an action because the event is over.
 *
 * Worth singling out: it is not a failure the player can retry, and the whole
 * app should move to the closing screen rather than showing a toast on a page
 * that will never accept another submission.
 */
const isEventClosed = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 403 && /has ended/i.test(error.message);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [adminSelectedEventId, setAdminSelectedEventId] = useState<string | null>(null);
  const [team, setTeam] = useState<ApiTeam | null>(null);
  const [board, setBoard] = useState<ApiBoard | null>(null);
  const [scoreboard, setScoreboard] = useState<TeamScore[]>([]);
  const [scoreboardFrozen, setScoreboardFrozen] = useState(false);
  const [bootNonce, setBootNonce] = useState(0);

  const adminEvent = allEvents.find((e) => e.id === adminSelectedEventId) ?? event;

  // UI-only state. None of this is authoritative, so it stays local.
  const [currentView, setCurrentView] = useState<ViewType>('LOGIN');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('breachpoint_audio') !== 'false';
    } catch {
      return true;
    }
  });

  const eventId = event?.id ?? null;

  // ------------------------------------------------------------- boot ----

  /**
   * Resolves session -> event -> team -> board, in that order, and lands on the
   * phase matching how far it got. A missing team is not an error: it is the
   * normal state of a player who has just registered, and the team gate is the
   * screen for it.
   */
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setPhase('loading');
      setBootError(null);

      if (!getToken()) {
        if (!cancelled) setPhase('unauthenticated');
        return;
      }

      try {
        const user = await api.me();
        if (cancelled) return;
        setCurrentUser(user);

        const [events, categories] = await Promise.all([
          api.listEvents(),
          // Names for the category ids the board sends. Not worth failing boot
          // over — challenges render with a neutral label without it.
          api.listCategories().catch(() => []),
        ]);
        if (cancelled) return;
        setAllEvents(events);

        setCategoryNames(Object.fromEntries(categories.map((c) => [c.id, c.name])));

        const target =
          events.find((e) => e.slug === EVENT_SLUG) ??
          events.find((e) => e.isPublished) ??
          events[0];
        if (!target) {
          setBootError(
            'No event is open. Seed and publish one: `bun run db:seed && bun run db:publish`.',
          );
          setPhase('error');
          return;
        }
        setEvent(target);

        // Team membership is readable — and formable — outside the window:
        // players register before the gun and the roster survives the close.
        let myTeam: ApiTeam | null = null;
        try {
          myTeam = await api.myTeam(target.id);
          if (cancelled) return;
          setTeam(myTeam);
        } catch (error) {
          // 404 is "no team yet", which is a screen, not a failure.
          if (!(error instanceof ApiError && error.status === 404)) throw error;
        }

        // Outside the window the board is refused by design; a lobby and a
        // final scoreboard are the screens for that, not an error.
        const where = eventWindow(target, Date.now());
        if (where !== 'running') {
          if (!cancelled) setPhase(where);
          return;
        }

        if (!myTeam) {
          if (!cancelled) setPhase('no-team');
          return;
        }

        const fresh = await api.board(target.id);
        if (cancelled) return;
        setBoard(fresh);
        setPhase('ready');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          setToken(null);
          setCurrentUser(null);
          setPhase('unauthenticated');
          return;
        }
        setBootError(errorMessage(error));
        setPhase('error');
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [bootNonce]);

  const retryBoot = useCallback(() => setBootNonce((n) => n + 1), []);

  /** Re-reads user team information from the server. */
  const refreshTeam = useCallback(async () => {
    if (!eventId) return;
    try {
      const freshTeam = await api.myTeam(eventId);
      setTeam(freshTeam);
    } catch {
      /* non-fatal */
    }
  }, [eventId]);

  /** Re-reads the board and team. Safe to call from anywhere; failures are non-fatal. */
  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const [freshBoard, freshTeam] = await Promise.allSettled([
        api.board(eventId),
        api.myTeam(eventId),
      ]);
      if (freshBoard.status === 'fulfilled') {
        setBoard(freshBoard.value);
      } else {
        const error = freshBoard.reason;
        if (error instanceof ApiError && error.status === 401) {
          setToken(null);
          setCurrentUser(null);
          setPhase('unauthenticated');
          return;
        } else if (isEventClosed(error)) {
          setPhase('ended');
          return;
        }
      }
      if (freshTeam.status === 'fulfilled') {
        setTeam(freshTeam.value);
      }
    } catch {
      /* non-fatal */
    }
  }, [eventId]);

  // Poll while the tab is visible. A CTF board moves under the player's feet —
  // reveals land, glitches open, decay shifts — and a stale board silently
  // lies about what is open.
  useEffect(() => {
    if (phase !== 'ready' || !eventId) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(tick, BOARD_POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [phase, eventId, refresh]);

  // One clock for the countdown and the glitch bar.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const window_ = eventWindow(event, now);

  /**
   * Crossing the start or the end of the event while the tab is open.
   *
   * Without this a player who waited in the lobby would sit there after the
   * gun, and a player mid-challenge would keep submitting into 403s after the
   * close. The start re-runs boot because the board only becomes readable then;
   * the end just drops to the closing screen.
   */
  useEffect(() => {
    if (window_ === 'running' && (phase === 'pending' || phase === 'ended')) {
      retryBoot();
    } else if (window_ === 'pending' && (phase === 'ready' || phase === 'no-team')) {
      setPhase('pending');
    } else if (window_ === 'ended' && (phase === 'ready' || phase === 'no-team')) {
      setPhase('ended');
    }
  }, [window_, phase, retryBoot]);

  useEffect(() => {
    soundFx.enabled = audioEnabled;
    try {
      localStorage.setItem('breachpoint_audio', String(audioEnabled));
    } catch {
      /* ignore */
    }
  }, [audioEnabled]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ------------------------------------------------------- derived state ----

  const paths = useMemo(() => pathStates(board), [board]);
  const chosenPath = useMemo<PathId | null>(() => {
    const code = board?.path?.code;
    return code && isPathId(code) ? code : null;
  }, [board]);

  const visibleChallenges = useMemo(() => boardChallenges(board), [board]);

  const challengesByPath = useMemo(() => {
    const map = new Map<PathId, Challenge[]>();
    for (const code of ['A'] as PathId[]) {
      map.set(code, challengesForPath(board, code));
    }
    return map;
  }, [board]);

  const getPathChallenges = useCallback(
    (path: PathId) => challengesByPath.get(path) ?? [],
    [challengesByPath],
  );

  /**
   * Every node of every path by slot, not just the revealed ones — the hash
   * router can deep-link to any slot, and a sealed or already-closed node has
   * to resolve to *something* so the challenge page can explain itself rather
   * than render a blank.
   */
  const bySlot = useMemo(() => {
    const map = new Map<string, Challenge>();
    for (const list of challengesByPath.values()) {
      for (const c of list) map.set(c.slot, c);
    }
    return map;
  }, [challengesByPath]);

  const solvedSlots = useMemo(
    () => visibleChallenges.filter((c) => c.status === 'solved').map((c) => c.slot),
    [visibleChallenges],
  );
  const activeChallenge = activeSlot ? bySlot.get(activeSlot) ?? null : null;

  const pathScores = useMemo(() => {
    const s = board?.pathScores;
    return {
      pathA: s?.A ?? 0,
      // The server's score includes pathless challenges and is authoritative.
      total: board?.score ?? 0,
    };
  }, [board]);

  const glitch = board?.timeGlitch.active ?? null;
  const glitchEndsAt = glitch ? new Date(glitch.endsAt).getTime() : null;

  /**
   * The numbers the glitch takeover animates rewinding (and restoring at window end).
   *
   * Derived dynamically from the active/inspected challenge, or the most decayed open
   * node on the active path, ensuring players see their actual current points and initial
   * target points rather than a hardcoded fixed value.
   */
  const glitchSample = useMemo(() => {
    const decayedOpen = visibleChallenges.find((c) => c.status === 'open' && c.currentPoints < c.points);
    const activeIsDecayed = activeChallenge && activeChallenge.currentPoints < activeChallenge.points;
    const target = (activeIsDecayed ? activeChallenge : null)
      ?? decayedOpen
      ?? activeChallenge
      ?? visibleChallenges.find((c) => c.status === 'open')
      ?? visibleChallenges[0]
      ?? null;

    if (!target || target.points === 0) {
      return { initial: 500, current: 300, original: 500, decayed: 300 };
    }

    const initial = target.points;
    let current = target.currentPoints;

    // If currentPoints is identical to initial (e.g. 0 solves or backend already boosted during glitch),
    // derive the standard decayed level from minPoints or 65% of initial so rewind/return is perceptible:
    if (current >= initial) {
      if (target.minPoints < initial) {
        current = target.minPoints;
      } else {
        current = Math.max(10, Math.round(initial * 0.65));
      }
    }

    return {
      initial,
      current,
      original: initial,
      decayed: current,
      slot: target.slot,
      title: target.title,
    };
  }, [visibleChallenges, activeChallenge]);

  /**
   * Milliseconds to the next boundary: the gun while pending, the close while
   * running. Null once the event is over — there is nothing left to count to.
   */
  const windowMs = useMemo(() => {
    if (window_ === 'pending' && event?.startsAt) {
      return Math.max(0, new Date(event.startsAt).getTime() - now);
    }
    if (window_ === 'running' && event?.endsAt) {
      return Math.max(0, new Date(event.endsAt).getTime() - now);
    }
    return null;
  }, [window_, event, now]);

  /**
   * A CTF clock counts down to a boundary, not up from the player's first
   * login — the old T+ timer measured nothing anyone scored against.
   */
  const formattedTimer = useMemo(() => {
    if (windowMs === null) return 'CLOSED';
    const h = Math.floor(windowMs / 3_600_000);
    const m = Math.floor((windowMs % 3_600_000) / 60_000);
    const s = Math.floor((windowMs % 60_000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `T− ${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [windowMs]);

  // -------------------------------------------------------------- routing ----

  const syncHash = useCallback((view: ViewType, slot?: string | null) => {
    try {
      const h = viewToHash(view, slot);
      if (window.location.hash !== h) window.location.hash = h;
    } catch {
      /* non-browser env */
    }
  }, []);

  const navigateTo = useCallback(
    (view: ViewType, slot?: string | null) => {
      soundFx.playClick();
      if (slot) setActiveSlot(slot);
      setCurrentView(view);
      syncHash(view, slot ?? (view === 'CHALLENGE' ? activeSlot : null));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeSlot, syncHash],
  );

  // Deep links and browser back/forward.
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'no-team' && phase !== 'pending' && phase !== 'ended') return;

    const applyRoute = (route: ParsedRoute) => {
      if (route.slot) setActiveSlot(route.slot);
      setCurrentView(route.view);
    };

    const onHashChange = () => {
      const r = parseHash(window.location.hash);
      if (r) applyRoute(r);
    };

    const initial = parseHash(window.location.hash);
    if (initial) applyRoute(initial);
    else if (phase === 'ready') setCurrentView('DASHBOARD');

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [phase]);

  // Keep the view legal for the phase: no board pages without a board.
  // Admin views bypass this — admins can access the console without a team.
  useEffect(() => {
    const hash = window.location.hash;
    const isAdminHash = hash.startsWith('#/admin');
    if (phase === 'unauthenticated') setCurrentView('LOGIN');
    else if (phase === 'no-team' && !isAdminHash && !currentUser?.isAdmin) setCurrentView('TEAM');
  }, [phase, currentUser]);

  // ---------------------------------------------------------------- UI ----

  const notify = useCallback(
    (type: 'success' | 'error' | 'info', title: string, message: string) => {
      if (type === 'error') soundFx.playError();
      else soundFx.playClick();
      setToast({ id: `${Date.now()}`, type, title, message });
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);
  const toggleAudio = useCallback(() => setAudioEnabled((a) => !a), []);

  // ------------------------------------------------------------ session ----

  const adoptSession = useCallback(async (auth: { token: string; user: AuthUser }) => {
    setToken(auth.token);
    setCurrentUser(auth.user);
    setAuthError(null);
    setBootNonce((n) => n + 1);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      setBusy(true);
      try {
        const auth = await api.login(email.trim(), password);
        await adoptSession(auth);
        soundFx.playClick();
        if (auth.user.isAdmin) {
          setCurrentView('ADMIN');
          syncHash('ADMIN');
        }
        return { success: true, message: `Welcome, ${auth.user.username}.` };
      } catch (error) {
        const message = errorMessage(error);
        setAuthError(message);
        soundFx.playError();
        return { success: false, message };
      } finally {
        setBusy(false);
      }
    },
    [adoptSession],
  );

  const signup = useCallback(
    async (username: string, email: string, password: string): Promise<ActionResult> => {
      setBusy(true);
      try {
        const auth = await api.signup(username.trim(), email.trim(), password);
        await adoptSession(auth);
        soundFx.playClick();
        return { success: true, message: `Registered. Welcome, ${auth.user.username}.` };
      } catch (error) {
        const message = errorMessage(error);
        setAuthError(message);
        soundFx.playError();
        return { success: false, message };
      } finally {
        setBusy(false);
      }
    },
    [adoptSession],
  );

  const logout = useCallback(() => {
    soundFx.playClick();
    setToken(null);
    setCurrentUser(null);
    setTeam(null);
    setBoard(null);
    setEvent(null);
    setActiveSlot(null);
    setAuthError(null);
    setPhase('unauthenticated');
    setCurrentView('LOGIN');
    syncHash('LOGIN');
  }, [syncHash]);

  // --------------------------------------------------------------- team ----

  const createTeam = useCallback(
    async (name: string): Promise<ActionResult> => {
      if (!eventId) return { success: false, message: 'No event loaded.' };
      setBusy(true);
      try {
        const created = await api.createTeam(eventId, name.trim());
        setTeam(created);
        // Before the gun there is no board to fetch; the lobby is the screen.
        if (eventWindow(event, Date.now()) !== 'running') {
          setPhase('pending');
          setCurrentView('DASHBOARD');
          return { success: true, message: `Team ${created.name} created. Join code: ${created.joinCode}` };
        }
        setBoard(await api.board(eventId));
        setPhase('ready');
        setCurrentView('DASHBOARD');
        syncHash('DASHBOARD');
        return { success: true, message: `Team ${created.name} created. Join code: ${created.joinCode}` };
      } catch (error) {
        return { success: false, message: errorMessage(error) };
      } finally {
        setBusy(false);
      }
    },
    [eventId, event, syncHash],
  );

  const joinTeam = useCallback(
    async (name: string, joinCode: string): Promise<ActionResult> => {
      if (!eventId) return { success: false, message: 'No event loaded.' };
      setBusy(true);
      try {
        const joined = await api.joinTeam(eventId, name.trim(), joinCode.trim().toUpperCase());
        setTeam(joined);
        if (eventWindow(event, Date.now()) !== 'running') {
          setPhase('pending');
          setCurrentView('DASHBOARD');
          return { success: true, message: `Joined ${joined.name}.` };
        }
        setBoard(await api.board(eventId));
        setPhase('ready');
        setCurrentView('DASHBOARD');
        syncHash('DASHBOARD');
        return { success: true, message: `Joined ${joined.name}.` };
      } catch (error) {
        return { success: false, message: errorMessage(error) };
      } finally {
        setBusy(false);
      }
    },
    [eventId, event, syncHash],
  );

  // -------------------------------------------------------------- paths ----

  const pathIdFor = useCallback(
    (code: PathId) => paths.find((p) => p.code === code)?.id ?? null,
    [paths],
  );

  const choosePath = useCallback(
    async (code: PathId): Promise<ActionResult> => {
      const id = pathIdFor(code);
      if (!eventId || !id) return { success: false, message: 'Path not available.' };
      setBusy(true);
      try {
        await api.selectPath(eventId, id);
        await refresh();
        soundFx.playClick();
        setCurrentView('DASHBOARD');
        syncHash('DASHBOARD');
        return { success: true, message: `Committed to Path ${code}.` };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'PATH LOCKED', message);
        return { success: false, message };
      } finally {
        setBusy(false);
      }
    },
    [eventId, pathIdFor, refresh, notify, syncHash],
  );

  // --------------------------------------------------------------- play ----

  const submitFlag = useCallback(
    async (challengeId: string, flag: string): Promise<ActionResult> => {
      if (!eventId) return { success: false, message: 'No event loaded.' };
      const trimmed = flag.trim();
      if (!trimmed) return { success: false, message: 'Enter a flag before submitting.' };

      // Path challenges carry a slot ("A-07"); the welcome gate and the
      // Standalone challenges are pathless, so fall back to their title.
      const challenge = visibleChallenges.find((c) => c.id === challengeId) ?? null;
      const standalone = board?.standalone.find((c) => c.id === challengeId) ?? null;
      const label = challenge?.slot ?? standalone?.title ?? 'CHALLENGE';
      setBusy(true);
      try {
        const result = await api.submitFlag(eventId, challengeId, trimmed);

        if (result.verdict !== 'correct') {
          soundFx.playError();
          setToast({
            id: `${Date.now()}`,
            type: 'error',
            title: result.verdict === 'duplicate' ? 'ALREADY HELD' : 'FLAG REJECTED',
            message: result.message,
          });
          return { success: false, message: result.message };
        }

        soundFx.playSuccess();
        const awarded = result.pointsAwarded ?? 0;
        const glitchNote = result.timeGlitch ? ' · TIME GLITCH: full value, no decay' : '';
        const bloodNote = result.firstBlood ? ' · FIRST BLOOD' : '';
        setToast({
          id: `${Date.now()}`,
          type: 'success',
          title: `FLAG VERIFIED — ${label}`,
          message: `+${awarded} PTS${bloodNote}${glitchNote}`,
          points: awarded,
          pathId: challenge?.pathId,
        });

        // The debrief is the reward for solving, and the server only releases
        // it on a correct submission.
        // Story elements removed per user request.

        if (result.fragment) {
          notify(
            'success',
            'FRAGMENT SECURED',
            `${result.fragment.toUpperCase()} is yours. Carry it to the Convergence Terminal.`,
          );
        }

        // The submission response is authoritative. Refresh the board without
        // delaying the challenge view's immediate solved feedback.
        void refresh();
        return {
          success: true,
          message: `${result.message} +${awarded} PTS`,
          points: awarded,
          pathId: challenge?.pathId,
        };
      } catch (error) {
        const message = errorMessage(error);
        soundFx.playError();
        if (isEventClosed(error)) setPhase('ended');
        return { success: false, message };
      } finally {
        setBusy(false);
      }
    },
    [eventId, visibleChallenges, board, refresh, notify],
  );

  const loadScoreboard = useCallback(async () => {
    if (!eventId) return;
    try {
      const result = await api.scoreboard(eventId);
      setScoreboard(toScoreboard(result, team?.id ?? null));
      setScoreboardFrozen(result.frozen);
    } catch {
      /* the board keeps whatever it last showed */
    }
  }, [eventId, team]);

  // ------------------------------------------------------------- exports ----

  const value: GameContextType = {
    phase,
    bootError,
    busy,
    retryBoot,
    currentUser,
    authError,
    login,
    signup,
    logout,
    // Event + team
    event,
    adminEvent,
    allEvents,
    adminSelectedEventId,
    setAdminSelectedEventId,
    window: window_,
    windowMs,
    team,
    teamName: team?.name ?? board?.team.name ?? 'OPERATIVE',
    refreshTeam,
    createTeam,
    joinTeam,
    board,
    refresh,
    paths,
    chosenPath,
    getPathChallenges,
    visibleChallenges,
    activeChallenge,
    activeChallengeId: activeSlot,
    solvedSlots,
    score: board?.score ?? 0,
    rank: board?.rank ?? null,
    pathScores,
    welcome: welcomeChallenge(board),
    formattedTimer,
    glitchEndsAt,
    glitchLabel: glitch?.label ?? null,
    glitchSample,
    choosePath,
    submitFlag,
    scoreboard,
    scoreboardFrozen,
    loadScoreboard,
    currentView,
    navigateTo,
    toast,
    notify,
    dismissToast,
    audioEnabled,
    toggleAudio,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
