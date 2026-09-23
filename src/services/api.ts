/**
 * HTTP client for the BreachPoint backend.
 *
 * One function per route, mirroring `breachpoint-backend/src/routes`. Nothing
 * in here knows about the game — it moves JSON and raises `ApiError`. The
 * translation between backend shapes and what the UI renders lives in
 * `services/backend.ts`.
 *
 * Auth uses a bearer token held in memory for this page session. The backend
 * uses the Authorization header, so the token is never persisted in browser
 * storage or sent as a cross-origin cookie.
 */

function normalizeApiBase(raw: string | undefined): string {
  if (!raw) return 'http://localhost:8080';
  let trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  // If protocol was omitted (e.g. breach-backend-production.up.railway.app), default to https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/** Base URL of the API, e.g. https://breach-backend-production.up.railway.app */
export const API_BASE: string = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL as string | undefined
);

/** Slug of the event this build plays. Resolved to an id once, at boot. */
export const EVENT_SLUG: string =
  (import.meta.env.VITE_EVENT_SLUG as string | undefined) ?? 'breachpoint-2026-r1';

/** Set VITE_USE_MOCK_API=true for an in-memory, self-contained CTF demo. */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

let token: string | null = null;

export const getToken = () => token;

export function setToken(next: string | null) {
  token = next;
}

/**
 * A non-2xx response. `status` is kept because the UI reacts differently to
 * each: 401 means the token died and the player must log in again, 409 is a
 * legitimate game state ("already on a path"), 403 means the event is closed.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Network failure, DNS, CORS — the request never reached the API. */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError(
      `Cannot reach the API at ${API_BASE}. Is the backend running?`,
    );
  }

  // 204 and empty bodies are legitimate; don't try to parse them.
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    // An expired or revoked token can't be recovered from by retrying; drop it
    // so the app falls back to the login screen instead of looping on 401s.
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {});
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = <T = void>(path: string) => request<T>('DELETE', path);

// ---------------------------------------------------------------- types ----

export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  isFrozen: boolean;
}

export interface ApiTeamMember {
  userId: string;
  username: string;
  displayName?: string | null;
  role: 'captain' | 'member';
}

export interface ApiTeam {
  id: string;
  name: string;
  joinCode: string;
  eventId: string;
  myRole?: 'captain' | 'member';
  members?: ApiTeamMember[];
}

export type ChallengeStatus = 'solved' | 'open';

export interface ApiBoardChallenge {
  id: string;
  pathId?: string;
  pathCode?: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  /** What a solve pays right now, after decay, before the path multiplier. */
  currentPoints: number;
  /** Teams that have already solved it — what drove the decay. */
  solves: number;
  maxAttempts: number | null;
  author: string | null;
  sequence: number;
  tier: 'past' | 'present' | 'future';
  status: ChallengeStatus;
  resourceLink?: string | null;
}

export interface ApiStandaloneChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  currentPoints: number;
  solves: number;
  maxAttempts: number | null;
  author: string | null;
  status: ChallengeStatus;
  resourceLink?: string | null;
  /** True for a standalone final challenge, false for the welcome gate. */
  isFinal: boolean;
}

export interface ApiBoardPath {
  id: string;
  code: string;
  name: string;
  delivers: 'who' | 'how' | 'why';
  introNarration: string;
  isActive: boolean;
  isAttempted: boolean;
  isAvailable: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
  canSwitchFree?: boolean;
  rewardMultiplier: string | null;
  entryReason: string | null;
  solved: number;
  total: number;
  points: number;
  finalChallenge?: {
    id: string;
    title: string;
    slot: string;
    isSolved: boolean;
    points: number;
  } | null;
}

export interface ApiActivePath {
  id: string;
  code: string;
  name: string;
  delivers: 'who' | 'how' | 'why';
  introNarration: string;
  rewardMultiplier: string;
  entryReason: string;
  solved: number;
  total: number;
  isCompleted?: boolean;
}

export interface ApiTimeGlitch {
  active: { id: string; label: string | null; endsAt: string } | null;
  next: { id: string; label: string | null; startsAt: string; endsAt: string } | null;
}

export interface ApiBoard {
  team: { id: string; name: string };
  score: number;
  rank: number | null;
  solveCount: number;
  pathScores: { A: number; standalone: number };
  paths: ApiBoardPath[];
  path: ApiActivePath | null;
  challenges: ApiBoardChallenge[];
  standalone: ApiStandaloneChallenge[];
  timeGlitch: ApiTimeGlitch;
}

export interface ApiSubmitResult {
  verdict: 'correct' | 'incorrect' | 'duplicate' | 'rate_limited';
  message: string;
  basePoints?: number;
  multiplier?: string;
  pointsAwarded?: number;
  solveOrder?: number;
  firstBlood?: boolean;
  timeGlitch?: { id: string; label: string | null } | null;
  fragment?: 'who' | 'how' | 'why' | null;
  revealed?: string[];
}

export interface AdminSpinWheelLogItem {
  id: string;
  eventId: string;
  teamId: string;
  teamName: string;
  userId: string;
  username: string;
  challengeId: string;
  challengeTitle: string;
  segment: string;
  isFreeSpin: boolean;
  awardedData?: {
    type?: string;
    game?: string;
    title?: string;
    message?: string;
    hintId?: string | null;
    hintBody?: string;
    hintCostSaved?: number;
  } | Record<string, unknown> | null;
  spinsUsed: number;
  spinsRemaining: number;
  totalQuota: number;
  createdAt: string;
}

export interface AdminSpinWheelResponse {
  totalQuota: number;
  stats: {
    totalSpins: number;
    totalFreeHints: number;
    totalFreeSpins: number;
    activeTeamsCount: number;
  };
  probabilities: Array<{
    segment: string;
    label: string;
    probability: string;
    probValue: number;
  }>;
  logs: AdminSpinWheelLogItem[];
}

export interface ApiScoreboardEntry {
  teamId: string;
  displayName: string;
  isSolo: boolean;
  score: number | string;
  solveCount: number;
  lastSolveAt: string | null;
  rank: number;
}

export interface ApiScoreboard {
  frozen: boolean;
  frozenAt: string | null;
  entries: ApiScoreboardEntry[];
}

// --------------------------------------------------------- admin types ----

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  decayThreshold: number | null;
  decayType: 'logarithmic' | 'linear' | 'static';
  state: 'hidden' | 'visible' | 'locked';
  maxAttempts: number | null;
  author: string | null;
  pathCode?: string | null;
  sequence?: number | null;
  slot?: string | null;
}

export interface AdminHint {
  id: string;
  challengeId: string;
  body: string;
  cost: number;
  sortOrder: number;
  requiresHintId: string | null;
}

export type { AdminEventStats, AdminSubmissionLog, AdminTeamInfo } from '../types';
import type { AdminEventStats, AdminSubmissionLog, AdminTeamInfo } from '../types';

export interface AdminTimeGlitch {
  id: string;
  label: string | null;
  startsAt: string;
  endsAt: string;
  multiplier?: string | number;
}

export interface CreateChallengeBody {
  title: string;
  description: string;
  categoryId: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints: number;
  minPoints: number;
  decayThreshold?: number;
  decayType?: 'logarithmic' | 'linear' | 'static';
  flag: string;
  maxAttempts?: number;
  author?: string;
  resourceLink?: string;
}

export interface PatchChallengeBody {
  title?: string;
  description?: string;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  initialPoints?: number;
  minPoints?: number;
  decayThreshold?: number;
  decayType?: 'logarithmic' | 'linear' | 'static';
  flag?: string;
  state?: 'hidden' | 'visible' | 'locked';
  maxAttempts?: number | null;
  author?: string;
  resourceLink?: string | null;
}

// ------------------------------------------------------------ endpoints ----

import { mockUser, mockEvents, mockBoard, mockCategories, mockChallengeFlags } from '@mock-data';

const MOCK_TOKEN = 'breachpoint-mock-session';
const copy = <T,>(value: T): T => structuredClone(value);
let mockSessionUser: AuthUser | null = null;
let mockTeamState: ApiTeam | null = null;
let mockBoardState: ApiBoard = copy(mockBoard);

function mockAuth(username: string): AuthResponse {
  const cleanName = username.trim() || mockUser.username;
  const user = { ...mockUser, username: cleanName, displayName: cleanName };
  mockSessionUser = user;
  return { token: MOCK_TOKEN, user };
}

function mockCreateTeam(eventId: string, name: string): ApiTeam {
  const team: ApiTeam = {
    id: 'mock-team',
    name: name.trim() || 'Local Operatives',
    joinCode: 'MOCK42',
    eventId,
    myRole: 'captain',
  };
  mockTeamState = team;
  mockBoardState.team = { id: team.id, name: team.name };
  return copy(team);
}

function mockSubmitFlag(challengeId: string, flag: string): ApiSubmitResult {
  const challenge = mockBoardState.challenges.find((item) => item.id === challengeId);
  if (!challenge) return { verdict: 'incorrect', message: 'Mock challenge not found.' };
  if (challenge.status === 'solved') {
    return { verdict: 'duplicate', message: 'Your team already solved this challenge.' };
  }
  if (mockChallengeFlags[challengeId] !== flag.trim()) {
    return { verdict: 'incorrect', message: 'That flag is incorrect. Check the mock challenge objective.' };
  }

  const pointsAwarded = challenge.currentPoints * Number(mockBoardState.path?.rewardMultiplier ?? 1);
  challenge.status = 'solved';
  challenge.solves += 1;
  mockBoardState.score += pointsAwarded;
  mockBoardState.solveCount += 1;
  mockBoardState.rank = 1;
  mockBoardState.pathScores.A += pointsAwarded;
  const path = mockBoardState.paths.find((item) => item.code === challenge.pathCode);
  if (path) {
    path.solved += 1;
    path.points += pointsAwarded;
    path.isCompleted = path.solved >= path.total;
  }
  if (mockBoardState.path) mockBoardState.path.solved += 1;
  return {
    verdict: 'correct',
    message: 'Mock flag accepted.',
    basePoints: challenge.currentPoints,
    multiplier: mockBoardState.path?.rewardMultiplier ?? '1.00',
    pointsAwarded,
    solveOrder: mockBoardState.solveCount,
    firstBlood: challenge.solves === 1,
  };
}

export const api = {
  // auth
  signup: (username: string, email: string, password: string) =>
    USE_MOCK_API ? Promise.resolve(mockAuth(username)) : post<AuthResponse>('/auth/signup', { username, email, password }),
  login: (email: string, password: string) =>
    USE_MOCK_API ? Promise.resolve(mockAuth(email.split('@')[0])) : post<AuthResponse>('/auth/login', { email, password }),
  me: async () => {
    if (!USE_MOCK_API) return get<AuthUser>('/auth/me');
    if (!token) throw new ApiError(401, 'Sign in to continue.');
    return mockSessionUser ?? mockUser;
  },

  // events
  listEvents: async () => USE_MOCK_API ? copy(mockEvents) : get<ApiEvent[]>('/events'),

  // categories — names for the ids the board sends
  listCategories: async () => USE_MOCK_API ? copy(mockCategories) : get<{ id: number; name: string }[]>('/categories'),

  // teams
  createTeam: (eventId: string, name: string) =>
    USE_MOCK_API ? Promise.resolve(mockCreateTeam(eventId, name)) : post<ApiTeam>(`/events/${eventId}/teams`, { name }),
  joinTeam: (eventId: string, name: string, joinCode: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockCreateTeam(eventId, name || `Joined ${joinCode.toUpperCase()}`))
      : post<ApiTeam>(`/events/${eventId}/teams/join`, { name, joinCode }),
  myTeam: async (eventId: string) => {
    if (!USE_MOCK_API) return get<ApiTeam>(`/events/${eventId}/teams/me`);
    if (!mockTeamState) throw new ApiError(404, 'No team has been created in the mock session.');
    return copy(mockTeamState);
  },

  // the event page, in one call
  board: async (eventId: string) => USE_MOCK_API ? copy(mockBoardState) : get<ApiBoard>(`/events/${eventId}/board`),

  // paths
  selectPath: (eventId: string, pathId: string) => {
    if (!USE_MOCK_API) return post<unknown>(`/events/${eventId}/paths/select`, { pathId });
    if (!mockBoardState.paths.some((path) => path.id === pathId)) {
      return Promise.reject(new ApiError(404, 'Mock path not found.'));
    }
    return Promise.resolve(undefined);
  },
  // play
  submitFlag: (eventId: string, challengeId: string, flag: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockSubmitFlag(challengeId, flag))
      : post<ApiSubmitResult>(`/events/${eventId}/challenges/${challengeId}/submit`, { flag }),
  // board
  scoreboard: (eventId: string) => USE_MOCK_API
    ? Promise.resolve({
      frozen: false,
      frozenAt: null,
      entries: [{
        teamId: mockBoardState.team.id,
        displayName: mockBoardState.team.name,
        isSolo: false,
        score: mockBoardState.score,
        solveCount: mockBoardState.solveCount,
        lastSolveAt: null,
        rank: 1,
      }],
    })
    : get<ApiScoreboard>(`/events/${eventId}/scoreboard`),
  timeGlitch: (eventId: string) => USE_MOCK_API
    ? Promise.resolve(copy(mockBoardState.timeGlitch))
    : get<ApiTimeGlitch>(`/events/${eventId}/time-glitch`),

  // ---- admin ----

  // events
  adminCreateEvent: (body: { name: string; slug?: string; description?: string; startsAt?: string; endsAt?: string }) =>
    post<ApiEvent>('/admin/events', body),
  adminPatchEvent: (eventId: string, body: { name?: string; slug?: string; description?: string; startsAt?: string | null; endsAt?: string | null; isPublished?: boolean; isFrozen?: boolean }) =>
    patch<ApiEvent>(`/admin/events/${eventId}`, body),
  adminDeleteEvent: (eventId: string) =>
    del<unknown>(`/admin/events/${eventId}`),
  adminResetEvent: (eventId: string) =>
    post<unknown>(`/admin/events/${eventId}/reset`, {}),
  adminGetEventStats: (eventId: string) =>
    get<AdminEventStats>(`/admin/events/${eventId}/stats`),

  // categories
  adminCreateCategory: (name: string) =>
    post<{ id: number; name: string }>('/admin/categories', { name }),
  adminDeleteCategory: (id: number) =>
    del(`/admin/categories/${id}`),

  // challenges
  adminListChallenges: (eventId: string) =>
    get<AdminChallenge[]>(`/admin/events/${eventId}/challenges`),
  adminCreateChallenge: (eventId: string, body: CreateChallengeBody) =>
    post<AdminChallenge>(`/admin/events/${eventId}/challenges`, body),
  adminPatchChallenge: (eventId: string, challengeId: string, body: PatchChallengeBody) =>
    patch<AdminChallenge>(`/admin/events/${eventId}/challenges/${challengeId}`, body),
  adminDeleteChallenge: (eventId: string, challengeId: string) =>
    del<unknown>(`/admin/events/${eventId}/challenges/${challengeId}`),

  // hints
  adminListHints: (eventId: string, challengeId: string) =>
    get<AdminHint[]>(`/admin/events/${eventId}/challenges/${challengeId}/hints`),
  adminCreateHint: (eventId: string, challengeId: string, body: { body: string; cost?: number; sortOrder?: number; requiresHintId?: string }) =>
    post<AdminHint>(`/admin/events/${eventId}/challenges/${challengeId}/hints`, body),
  adminDeleteHint: (eventId: string, challengeId: string, hintId: string) =>
    del(`/admin/events/${eventId}/challenges/${challengeId}/hints/${hintId}`),

  // time glitches
  adminListGlitches: (eventId: string) =>
    get<AdminTimeGlitch[]>(`/admin/events/${eventId}/time-glitches`),
  adminCreateGlitch: (eventId: string, body: { label?: string; startsAt: string; endsAt: string; multiplier?: number }) =>
    post<AdminTimeGlitch>(`/admin/events/${eventId}/time-glitches`, body),
  adminGenerateGlitches: (eventId: string, body: { everyMinutes?: number; durationMinutes?: number; firstAt?: string }) =>
    post<AdminTimeGlitch[]>(`/admin/events/${eventId}/time-glitches/generate`, body),
  adminDeleteGlitch: (eventId: string, glitchId: string) =>
    del(`/admin/events/${eventId}/time-glitches/${glitchId}`),
  adminDeleteAllGlitches: async (eventId: string) => {
    try {
      return await del(`/admin/events/${eventId}/time-glitches`);
    } catch {
      const list = await api.adminListGlitches(eventId);
      return await Promise.all(list.map((g) => api.adminDeleteGlitch(eventId, g.id)));
    }
  },

  // teams
  adminListTeams: (eventId: string) =>
    get<AdminTeamInfo[]>(`/admin/events/${eventId}/teams`),
  adminPatchTeam: (eventId: string, teamId: string, body: { banned?: boolean; name?: string }) =>
    patch<AdminTeamInfo>(`/admin/events/${eventId}/teams/${teamId}`, body),
  adminDeleteTeam: (eventId: string, teamId: string) =>
    del<unknown>(`/admin/events/${eventId}/teams/${teamId}`),

  // live submissions
  adminListSubmissions: (eventId: string, limit?: number) =>
    get<AdminSubmissionLog[]>(`/admin/events/${eventId}/submissions${limit ? `?limit=${limit}` : ''}`),

  // spin wheel audit logs
  adminGetSpinWheelLogs: (eventId: string) =>
    get<AdminSpinWheelResponse>(`/admin/events/${eventId}/spin-wheel/logs`),
};
