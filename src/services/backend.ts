/**
 * The seam between the API and the UI.
 *
 * `services/api.ts` speaks HTTP; the views want `Challenge`s with a slot code,
 * a chart position and a path colour. This module does that translation and
 * nothing else — no state, no fetching policy, no caching. `GameContext` owns
 * when to call the API; this owns what the answer means.
 *
 * The rule it enforces: every word the player reads about the game comes from
 * the server. The only local contribution is geometry and colour.
 */
import {
  ApiBoard,
  ApiBoardChallenge,
  ApiHint,
  ApiScoreboard,
  ApiStandaloneChallenge,
} from './api';
import {
  Challenge,
  ChallengeStatus,
  Difficulty,
  EraType,
  FragmentKey,
  Hint,
  PathId,
  PathState,
  StandaloneChallenge,
  TeamScore,
} from '../types';
import { positionFor, slotCode } from '../data/nodeLayout';
import { FRAGMENT_LABEL, isPathId } from '../data/pathsData';

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
 * Joins one server challenge to its chart position.
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
  delivers: FragmentKey,
  total: number,
): Challenge {
  const slot = slotCode(pathCode, challenge.sequence);
  const pos = positionFor(slot, challenge.sequence, total);
  return {
    id: challenge.id,
    slot,
    pathId: pathCode,
    index: challenge.sequence,
    title: challenge.title,
    objective: challenge.description,
    era: TIER_TO_ERA[challenge.tier] ?? 'PRESENT',
    track: `${FRAGMENT_LABEL[delivers]} TRACK`,
    category: categoryName(challenge.categoryId),
    difficulty: challenge.difficulty,
    points: challenge.initialPoints,
    minPoints: challenge.minPoints,
    currentPoints: challenge.currentPoints,
    solves: challenge.solves,
    maxAttempts: challenge.maxAttempts,
    author: challenge.author,
    status: challenge.status,
    isPathFinal: challenge.isPathFinal,
    preStory: challenge.preStory,
    postStory: challenge.postStory,
    resourceLink: challenge.resourceLink ?? null,
    xPosPercent: pos.x,
    yPosPercent: pos.y,
  };
}

/**
 * The challenges the team can currently see, in sequence.
 *
 * Only the *active* path's challenges are on the board — that is the server's
 * reveal window, not an omission. Nodes the team has not reached yet simply
 * aren't in the list; `challengesForPath` pads the rest of the path with
 * locked placeholders so the chart still draws ten nodes.
 */
export function boardChallenges(board: ApiBoard | null): Challenge[] {
  if (!board) return [];
  const activeCode = board.path?.code;

  return board.challenges.map((c) => {
    const rawCode = (c as any).pathCode || activeCode;
    const code: PathId = isPathId(rawCode) ? rawCode : 'A';
    const pathObj = board.paths.find((p) => p.code === code) ?? board.path;
    const delivers = pathObj?.delivers ?? 'who';
    const total = pathObj?.total ?? 10;
    return hydrate(c, code, delivers, total);
  });
}

/**
 * Every node of a path, revealed or not — what the chart and the trail draw.
 *
 * Three kinds of node come out of this:
 *
 *  - fully hydrated, for the active path's current reveal window;
 *  - closed-but-contentless, for nodes the team finished on a path it has since
 *    left: the server sends those back as sequences in `history`, so the chart
 *    still shows the work without re-serving a closed path's content;
 *  - sealed, for everything the team has not reached.
 *
 * A sealed node is a real position with no content. There is nothing truthful
 * to print beyond "sealed" — inventing a title for it would be the old mock's
 * mistake in a new place.
 */
export function challengesForPath(board: ApiBoard | null, pathId: PathId): Challenge[] {
  const path = board?.paths.find((p) => p.code === pathId);
  const total = path?.total ?? 10;
  const revealed = new Map(
    boardChallenges(board)
      .filter((c) => c.pathId === pathId)
      .map((c) => [c.index, c]),
  );

  const history = board?.history.find((h) => h.code === pathId);
  const solvedSeq = new Set(history?.solved ?? []);
  const skippedSeq = new Set(history?.skipped ?? []);

  return Array.from({ length: total }, (_, i) => {
    const index = i + 1;
    const known = revealed.get(index);
    if (known) return known;

    const slot = slotCode(pathId, index);
    const pos = positionFor(slot, index, total);
    const status: ChallengeStatus = solvedSeq.has(index)
      ? 'solved'
      : skippedSeq.has(index)
        ? 'skipped'
        : 'locked';

    return {
      id: '',
      slot,
      pathId,
      index,
      title: status === 'locked' ? 'SEALED' : status === 'skipped' ? 'SKIPPED' : 'SOLVED',
      objective:
        status === 'locked'
          ? 'This node has not been revealed to your team yet.'
          : status === 'skipped'
            ? 'Skipped on a previous path — still available to solve.'
            : 'Solved on a previous path.',
      era: 'PRESENT' as EraType,
      track: path ? `${FRAGMENT_LABEL[path.delivers]} TRACK` : '',
      category: '—',
      difficulty: 'medium' as Difficulty,
      points: 0,
      minPoints: 0,
      currentPoints: 0,
      solves: 0,
      maxAttempts: null,
      author: null,
      status,
      isPathFinal: index === total,
      preStory: '',
      postStory: null,
      resourceLink: null,
      xPosPercent: pos.x,
      yPosPercent: pos.y,
    };
  });
}

export function pathStates(board: ApiBoard | null): PathState[] {
  if (!board) return [];
  return board.paths
    .filter((p) => isPathId(p.code))
    .map((p) => ({
      id: p.id,
      code: p.code as PathId,
      name: p.name,
      delivers: p.delivers,
      introNarration: p.introNarration,
      isActive: p.isActive,
      isAttempted: p.isAttempted,
      isAvailable: p.isAvailable,
      isCompleted: p.isCompleted,
      isLocked: p.isLocked,
      canSwitchFree: p.canSwitchFree,
      rewardMultiplier: p.rewardMultiplier,
      solved: p.solved,
      skipped: p.skipped,
      total: p.total,
      points: p.points,
      finalChallenge: p.finalChallenge ?? null,
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
 * The convergence final, once the server has revealed it.
 *
 * It is gated on holding all three fragments, so its mere presence in
 * `standalone` is the signal that the endgame is open — the UI never has to
 * decide that for itself.
 */
export function convergenceChallenge(board: ApiBoard | null): StandaloneChallenge | null {
  const found = board?.standalone.find((c) => c.isFinal);
  return found ? toStandalone(found) : null;
}

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

export function toHints(hints: ApiHint[]): Hint[] {
  return [...hints]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((h) => ({
      id: h.id,
      cost: h.cost,
      sortOrder: h.sortOrder,
      requiresHintId: h.requiresHintId,
      isUnlocked: h.isUnlocked,
      body: h.body,
    }));
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
