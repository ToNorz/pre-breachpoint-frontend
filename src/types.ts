export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ChallengeStatus = 'solved' | 'open';

export interface Challenge {
  id: string;
  title: string;
  objective: string;
  difficulty: Difficulty;
  category: string;
  points: number;
  status: ChallengeStatus;
  resourceLink?: string | null;
  solvesCount: number;
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
  | 'LOGIN'
  | 'TEAM'
  | 'DASHBOARD'
  | 'CHALLENGE'
  | 'BOARD'
  | 'ADMIN'
  | 'ADMIN_CHALLENGES'
  | 'ADMIN_TEAMS'
  | 'ADMIN_ACTIVITY'
  | 'ADMIN_LEADERBOARD';

export interface AdminTeamInfo {
  id: string;
  name: string;
  joinCode: string;
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
