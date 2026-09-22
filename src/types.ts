export type PathId = 'A' | 'B' | 'C';

export type EraType = 'PAST' | 'PRESENT' | 'FUTURE' | 'ENDGAME';

/** Server difficulty, as stored on `core_challenge`. */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** What a path hands over when its final challenge falls. */
export type FragmentKey = 'who' | 'how' | 'why';

export type ChallengeStatus = 'solved' | 'skipped' | 'open' | 'locked';

/**
 * Visual identity for a path. Colours, symbols and the in-fiction lead are
 * presentation; the path's name, what it delivers and its narration come from
 * the server.
 */
export interface PathSkin {
  id: PathId;
  keyNumber: number;
  lead: string;
  role: string;
  symbol: string;
  tone: string;
}

/**
 * One challenge as the UI renders it: the server's record of it, joined to the
 * local chart position.
 *
 * `id` is the server UUID — the only thing the API accepts. `slot` is the
 * display code ("A-07"), derived from path + sequence, and is what the hash
 * router and the node chart key on.
 */
export interface Challenge {
  id: string;
  slot: string;
  pathId: PathId;
  index: number;
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
  isPathFinal: boolean;
  /** The briefing shown before the challenge. */
  preStory: string;
  /** The debrief. Null until this team has solved it — the server withholds it. */
  postStory: string | null;
  resourceLink?: string | null;
  xPosPercent: number;
  yPosPercent: number;
}

/** A challenge belonging to no path: the welcome gate and the convergence final. */
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
  delivers: FragmentKey;
  introNarration: string;
  isActive: boolean;
  isAttempted: boolean;
  isAvailable: boolean;
  rewardMultiplier: string | null;
  solved: number;
  skipped: number;
  total: number;
  points: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  canSwitchFree?: boolean;
  finalChallenge?: {
    id: string;
    title: string;
    slot: string;
    isSolved: boolean;
    points: number;
  } | null;
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

export interface Hint {
  id: string;
  cost: number;
  sortOrder: number;
  requiresHintId: string | null;
  isUnlocked: boolean;
  body: string | null;
}

export type ViewType =
  | 'GATE'
  | 'LOGIN'
  | 'TEAM'
  | 'DASHBOARD'
  | 'MAP'
  | 'TRAIL'
  | 'CHALLENGE'
  | 'CONVERGENCE'
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

