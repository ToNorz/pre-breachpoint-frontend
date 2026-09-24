import {
  ApiBoard,
  ApiBoardChallenge,
  ApiScoreboard,
} from './api';
import {
  Challenge,
  Difficulty,
  TeamScore,
} from '../types';

export function hydrate(challenge: ApiBoardChallenge): Challenge {
  return {
    id: challenge.id,
    title: challenge.title,
    objective: challenge.description,
    difficulty: challenge.difficulty,
    category: challenge.category || "Misc",
    points: challenge.points,
    status: challenge.status === 'solved' ? 'solved' : 'open',
    resourceLink: challenge.resourceLink,
    solvesCount: challenge.solvesCount || 0,
  };
}

export function boardChallenges(board: ApiBoard | null): Challenge[] {
  if (!board) return [];
  return board.challenges.map(hydrate);
}

export function toScoreboard(board: ApiScoreboard, myTeamId: string | null): TeamScore[] {
  return board.entries.map((e) => ({
    rank: e.rank,
    teamId: e.teamId,
    name: e.displayName,
    points: Number(e.score ?? 0),
    solves: Number(e.solveCount ?? 0),
    lastSubmission: e.lastSolveAt,
    isMe: e.teamId === myTeamId,
  }));
}

export const DIFFICULTY_META: Record<Difficulty, { color: string; label: string }> = {
  easy: { color: '#5ED6E3', label: 'EASY' },
  medium: { color: '#E0A83E', label: 'MEDIUM' },
  hard: { color: '#E84D7E', label: 'HARD' },
  expert: { color: '#B36BFF', label: 'EXPERT' },
};

export function starFills(difficulty: Difficulty): (0 | 0.5 | 1)[] {
  switch (difficulty) {
    case 'easy': return [1, 0, 0];
    case 'medium': return [1, 0.5, 0];
    case 'hard': return [1, 1, 0];
    default: return [1, 1, 1];
  }
}
