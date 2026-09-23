export type PathId = 'A';

export type EraType = 'PAST' | 'PRESENT' | 'FUTURE';

/** Server difficulty, as stored on `core_challenge`. */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ChallengeStatus = 'solved' | 'open';

/**
 * One challenge as rendered by the dashboard.
 *
 * `id` is the server UUID — the only thing the API accepts. `slot` is the
 * display code ("A-07"), derived from path + sequence, and is what the hash
 * router and the challenge card uses.
 */
export interface Challenge {
  id: string;
  slot: string;
  pathId: PathId;
  title: string;
  objective: string;
  era: EraType;
  track: string;
  category: string;
  difficulty: Difficulty;
  /** Undecayed headline value. */
  points: number;
  minPoints: number;
  /** What a solve pays right now — decay applied, path multiplier not. */
  currentPoints: number;
  /** Teams that already hold it. */
  solves: number;
  maxAttempts: number | null;
  author: string | null;
  status: ChallengeStatus;
  resourceLink?: string | null;
}

/** A challenge that appears before the player joins the challenge board. */
export interface StandaloneChallenge {
  id: string;
  title: string;
  objective: string;
  difficulty: Difficulty;
  points: number;
  currentPoints: number;
  status: ChallengeStatus;
  resourceLink?: string | null;
}

export interface PathState {
  id: string;
  code: PathId;
  name: string;
  isActive: boolean;
  solved: number;
  total: number;
  points: number;
}

export interface TeamScore {
  rank: number;
  teamId: string;
  name: string;
  points: number;
  solves: number;
  lastSubmission: string | null;
  isMe: boolean;
}

export type ViewType =
  | 'GATE'
  | 'LOGIN'
  | 'TEAM'
  | 'DASHBOARD'

  | 'CHALLENGE'
  | 'BOARD'
  | 'ADMIN'
  | 'ADMIN_EVENTS'
  | 'ADMIN_CHALLENGES'
  | 'ADMIN_GLITCHES'
  | 'ADMIN_TEAMS'
  | 'ADMIN_ACTIVITY'
  | 'ADMIN_SPIN_WHEEL'
  | 'ADMIN_LEADERBOARD';

export interface AdminTeamInfo {
  id: string;
  eventId: string;
  name: string;
  joinCode: string;
  banned: boolean;
  score: number;
  solveCount?: number;
  createdAt: string;
  members: {
    userId: string;
    role: 'captain' | 'member';
    username: string;
    displayName: string | null;
  }[];
}

export interface AdminSubmissionLog {
  id: string;
  teamId: string;
  teamName: string;
  challengeId: string;
  challengeTitle: string;
  flag: string;
  verdict: 'correct' | 'incorrect' | 'rate_limited' | 'unsolvable' | 'invalid_state';
  submittedAt: string;
}

export interface AdminEventStats {
  challengesCount: number;
  totalPoints: number;
  teamsCount: number;
  solvesCount: number;
  submissionsCount: number;
}
