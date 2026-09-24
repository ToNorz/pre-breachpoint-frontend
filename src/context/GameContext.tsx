import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ApiBoard,
  ApiError,
  ApiTeam,
  AuthUser,
  NetworkError,
  api,
  getToken,
  setToken,
} from '../services/api';
import {
  boardChallenges,
  toScoreboard,
} from '../services/backend';
import {
  Challenge,
  TeamScore,
  ViewType,
} from '../types';
import { ParsedRoute, parseHash, viewToHash } from '../utils/router';
import { soundFx } from '../utils/audio';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export type Phase =
  | 'loading'
  | 'unauthenticated'
  | 'no-team'
  | 'ready'
  | 'error';

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

  // Team
  team: ApiTeam | null;
  refreshTeam: () => Promise<void>;
  createTeam: (name: string) => Promise<ActionResult>;
  joinTeam: (name: string, joinCode: string) => Promise<ActionResult>;

  // Server state
  board: ApiBoard | null;
  refresh: () => Promise<void>;
  visibleChallenges: Challenge[];
  activeChallenge: Challenge | null;
  solvedSlots: string[];
  score: number;
  rank: number | null;

  // Actions
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

const BOARD_POLL_MS = 5_000;

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [team, setTeam] = useState<ApiTeam | null>(null);
  const [board, setBoard] = useState<ApiBoard | null>(null);
  const [scoreboard, setScoreboard] = useState<TeamScore[]>([]);
  const [scoreboardFrozen] = useState(false);
  const [bootNonce, setBootNonce] = useState(0);

  const [currentView, setCurrentView] = useState<ViewType>('LOGIN');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('breachpoint_audio') !== 'false';
    } catch {
      return true;
    }
  });

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

        let myTeam: ApiTeam | null = null;
        try {
          myTeam = await api.myTeam();
          if (cancelled) return;
          setTeam(myTeam);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) throw error;
        }

        if (!myTeam) {
          if (!cancelled) setPhase('no-team');
          return;
        }

        const fresh = await api.board();
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

  const refreshTeam = useCallback(async () => {
    try {
      const freshTeam = await api.myTeam();
      setTeam(freshTeam);
    } catch {
      // non-fatal
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [freshBoard, freshTeam] = await Promise.allSettled([
        api.board(),
        api.myTeam(),
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
        }
      }
      if (freshTeam.status === 'fulfilled') {
        setTeam(freshTeam.value);
      }
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (phase !== 'ready') return;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(tick, BOARD_POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [phase, refresh]);

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

  const visibleChallenges = useMemo(() => boardChallenges(board), [board]);

  const bySlot = useMemo(() => {
    const map = new Map<string, Challenge>();
    for (const c of visibleChallenges) {
      map.set(c.id, c);
    }
    return map;
  }, [visibleChallenges]);

  const solvedSlots = useMemo(
    () => visibleChallenges.filter((c) => c.status === 'solved').map((c) => c.id),
    [visibleChallenges],
  );
  
  const activeChallenge = activeSlot ? bySlot.get(activeSlot) ?? null : null;

  const score = board?.score ?? 0;
  const rank = board?.rank ?? null;

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

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'no-team') return;

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

  useEffect(() => {
    const hash = window.location.hash;
    const isAdminHash = hash.startsWith('#/admin');
    if (phase === 'unauthenticated') setCurrentView('LOGIN');
    else if (phase === 'no-team' && !isAdminHash && !currentUser?.isAdmin) setCurrentView('TEAM');
  }, [phase, currentUser]);

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
    setActiveSlot(null);
    setAuthError(null);
    setPhase('unauthenticated');
    setCurrentView('LOGIN');
    syncHash('LOGIN');
  }, [syncHash]);

  const createTeam = useCallback(
    async (name: string): Promise<ActionResult> => {
      setBusy(true);
      try {
        const created = await api.createTeam(name.trim());
        setTeam(created);
        setBoard(await api.board());
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
    [syncHash],
  );

  const joinTeam = useCallback(
    async (name: string, joinCode: string): Promise<ActionResult> => {
      setBusy(true);
      try {
        const joined = await api.joinTeam(name.trim(), joinCode.trim().toUpperCase());
        setTeam(joined);
        setBoard(await api.board());
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
    [syncHash],
  );

  const submitFlag = useCallback(
    async (challengeId: string, flag: string): Promise<ActionResult> => {
      const trimmed = flag.trim();
      if (!trimmed) return { success: false, message: 'Enter a flag before submitting.' };

      setBusy(true);
      try {
        const result = await api.submitFlag(challengeId, trimmed);

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
        const challenge = visibleChallenges.find((c) => c.id === challengeId);
        
        setToast({
          id: `${Date.now()}`,
          type: 'success',
          title: `FLAG VERIFIED — ${challenge?.title ?? 'CHALLENGE'}`,
          message: 'Correct flag',
        });
        void refresh();
        return { success: true, message: 'Correct' };
      } catch (error) {
        const message = errorMessage(error);
        notify('error', 'SUBMISSION FAILED', message);
        return { success: false, message };
      } finally {
        setBusy(false);
      }
    },
    [visibleChallenges, refresh, notify],
  );

  const loadScoreboard = useCallback(async () => {
    try {
      const data = await api.scoreboard();
      setScoreboard(toScoreboard(data, team?.id ?? null));
    } catch {
      // non-fatal
    }
  }, [team]);

  return (
    <GameContext.Provider
      value={{
        phase,
        bootError,
        busy,
        retryBoot,
        currentUser,
        authError,
        login,
        signup,
        logout,
        team,
        refreshTeam,
        createTeam,
        joinTeam,
        board,
        refresh,
        visibleChallenges,
        activeChallenge,
        solvedSlots,
        score,
        rank,
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
