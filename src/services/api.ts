/**
 * HTTP client for the BreachPoint backend.
 */

function normalizeApiBase(raw: string | undefined): string {
  if (!raw) return 'http://localhost:8080';
  let trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

export const API_BASE: string = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL as string | undefined
);

let token: string | null = null;
export const getToken = () => token;
export function setToken(next: string | null) {
  token = next;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

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
    throw new NetworkError(`Cannot reach the API at ${API_BASE}. Is the backend running?`);
  }

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
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

const get = <T,>(path: string) => request<T>('GET', path);
const post = <T,>(path: string, body?: unknown) => request<T>('POST', path, body ?? {});
const patch = <T,>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = <T = void,>(path: string) => request<T>('DELETE', path);

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
  myRole?: 'captain' | 'member';
  members?: ApiTeamMember[];
}

export type ChallengeStatus = 'solved' | 'open';

export interface ApiBoardChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  points: number;
  status: ChallengeStatus;
  resourceLink?: string | null;
  solvesCount: number;
}

export interface ApiBoard {
  team: { id: string; name: string };
  score: number;
  rank: number | null;
  solveCount: number;
  challenges: ApiBoardChallenge[];
}

export interface ApiSubmitResult {
  verdict: 'correct' | 'incorrect' | 'duplicate' | 'rate_limited';
  message: string;
  pointsAwarded?: number;
  solveOrder?: number;
  firstBlood?: boolean;
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
  entries: ApiScoreboardEntry[];
}

// --------------------------------------------------------- admin types ----

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
}

export type AdminSubmissionLog = any;
export type AdminTeamInfo = any;

export interface CreateChallengeBody {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  flag: string;
}

export interface PatchChallengeBody {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  points?: number;
  flag?: string;
  resourceLink?: string;
}

// ------------------------------------------------------------ endpoints ----

export const api = {
  // auth
  signup: (username: string, email: string, password: string) =>
    post<AuthResponse>('/auth/signup', { username, email, password }),
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),
  me: () => get<AuthUser>('/auth/me'),

  // teams
  createTeam: (name: string) => post<ApiTeam>('/teams', { name }),
  joinTeam: (name: string, joinCode: string) => post<ApiTeam>('/teams/join', { name, joinCode }),
  myTeam: () => get<ApiTeam>('/teams/me'),

  // board
  board: () => get<ApiBoard>('/board'),

  // play
  submitFlag: (challengeId: string, flag: string) =>
    post<ApiSubmitResult>(`/challenges/${challengeId}/submit`, { flag }),
  
  // leaderboard
  scoreboard: () => get<ApiScoreboard>('/scoreboard'),

  // ---- admin ----
  
  // challenges
  adminListChallenges: () => get<AdminChallenge[]>('/admin/challenges'),
  adminCreateChallenge: (body: CreateChallengeBody) => post<AdminChallenge>('/admin/challenges', body),
  adminPatchChallenge: (challengeId: string, body: PatchChallengeBody) => patch<AdminChallenge>(`/admin/challenges/${challengeId}`, body),
  adminDeleteChallenge: (challengeId: string) => del<unknown>(`/admin/challenges/${challengeId}`),

  // teams
  adminListTeams: () => get<AdminTeamInfo[]>('/admin/teams'),
  adminPatchTeam: (teamId: string, body: { name?: string }) => patch<AdminTeamInfo>(`/admin/teams/${teamId}`, body),
  adminDeleteTeam: (teamId: string) => del<unknown>(`/admin/teams/${teamId}`),

  // live submissions
  adminListSubmissions: (limit?: number) => get<AdminSubmissionLog[]>(`/admin/submissions${limit ? `?limit=${limit}` : ''}`),
};
