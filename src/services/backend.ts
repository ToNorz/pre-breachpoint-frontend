/**
 * The seam between the API and the UI.
 *
 * `services/api.ts` speaks HTTP; the views want `Challenge`s with a slot code
 * and a path colour. This module does that translation and
 * nothing else — no state, no fetching policy, no caching. `GameContext` owns
 * when to call the API; this owns what the answer means.
 *
 * The rule it enforces: every word the player reads about the game comes from
 * the server. The only local contribution is geometry and colour.
 */
import {
  ApiBoard,
  ApiBoardChallenge,
  ApiScoreboard,
  ApiStandaloneChallenge,
} from './api';
import {
  Challenge,
  Difficulty,
  EraType,
  PathId,
  PathState,
  StandaloneChallenge,
  TeamScore,
} from '../types';
import { isPathId } from '../data/pathsData';

const slotCode = (pathCode: string, sequence: number) =>
  `${pathCode}-${String(sequence).padStart(2, '0')}`;

const TIER_TO_ERA: Record<string, EraType> = {
  past: 'PAST',
  present: 'PRESENT',
  future: 'FUTURE',
};

/**
 * Category names live in `core_category` and the board sends only the id. The
 * player-facing category list is a separate, rarely-changing call; until it has
 * been fetched, the id renders as a neutral label rather than a raw number.
 */
let categoryNames: Record<number, string> = {};
export const setCategoryNames = (names: Record<number, string>) => {
  categoryNames = names;
};
const categoryName = (id: number) => categoryNames[id] ?? 'UNCATEGORISED';

/**
 * Maps one server challenge to the player-facing challenge model.
 *
 * Two numbers, deliberately: `points` is the undecayed headline, and
 * `currentPoints` is what a solve pays right now with decay applied. Both come
 * from the server — the client must never compute decay itself, because the
 * price it quotes and the price the submission pays have to be the same
 * calculation.
 *
 * Neither includes the team's path multiplier, which is applied at solve time.
 */
function hydrate(
  challenge: ApiBoardChallenge,
  pathCode: PathId,
): Challenge {
  const slot = slotCode(pathCode, challenge.sequence);
  return {
    id: challenge.id,
    slot,
    pathId: pathCode,
    title: challenge.title,
    objective: challenge.description,
    era: TIER_TO_ERA[challenge.tier] ?? 'PRESENT',
    track: 'FLAG TRACK',
    category: categoryName(challenge.categoryId),
    difficulty: challenge.difficulty,
    points: challenge.initialPoints,
    minPoints: challenge.minPoints,
    currentPoints: challenge.currentPoints,
    solves: challenge.solves,
    maxAttempts: challenge.maxAttempts,
    author: challenge.author,
    status: challenge.status === 'solved' ? 'solved' : 'open',
    resourceLink: challenge.resourceLink ?? null,
  };
}

/**
 * Challenges supplied by the board, with server ids and content for play.
 */
export function boardChallenges(board: ApiBoard | null): Challenge[] {
  if (!board) return [];
  const activeCode = board.path?.code;

  return board.challenges.map((c) => {
    const rawCode = c.pathCode || activeCode;
    const code: PathId = isPathId(rawCode) ? rawCode : 'A';
    return hydrate(c, code);
  });
}

/** Return only challenges the board has actually supplied. */
export function challengesForPath(board: ApiBoard | null, pathId: PathId): Challenge[] {
  return boardChallenges(board).filter((challenge) => challenge.pathId === pathId);
}

export function pathStates(board: ApiBoard | null): PathState[] {
  if (!board) return [];
  return board.paths
    .filter((p) => isPathId(p.code))
    .map((p) => ({
      id: p.id,
      code: p.code as PathId,
      name: p.name,
      isActive: p.isActive,
      solved: p.solved,
      total: p.total,
      points: p.points,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * The welcome gate: the pathless challenge that must fall before a path can be
 * chosen. The server flags it (`isFinal: false`) rather than leaving the client
 * to infer it from point values.
 */
export function welcomeChallenge(board: ApiBoard | null): StandaloneChallenge | null {
  const found = board?.standalone.find((c) => !c.isFinal);
  return found ? toStandalone(found) : null;
}

/**
 * Convert the pathless welcome challenge to the UI shape.
 */
function toStandalone(c: ApiStandaloneChallenge): StandaloneChallenge {
  return {
    id: c.id,
    title: c.title,
    objective: c.description,
    difficulty: c.difficulty,
    points: c.initialPoints,
    currentPoints: c.currentPoints,
    status: c.status,
    resourceLink: c.resourceLink ?? null,
  };
}

export function toScoreboard(board: ApiScoreboard, myTeamId: string | null): TeamScore[] {
  return board.entries.map((e) => ({
    rank: e.rank,
    teamId: e.teamId,
    name: e.displayName,
    // The view returns `numeric`, which arrives as a string over JSON.
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

/** Three-star rendering of a difficulty, halves allowed. */
export function starFills(difficulty: Difficulty): (0 | 0.5 | 1)[] {
  switch (difficulty) {
    case 'easy': return [1, 0, 0];
    case 'medium': return [1, 0.5, 0];
    case 'hard': return [1, 1, 0];
    default: return [1, 1, 1];
  }
}
