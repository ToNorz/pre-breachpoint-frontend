import type { ApiBoard, ApiEvent, ApiTeam, AuthUser } from './api';

export const mockUser: AuthUser = {
  id: 'mock-user',
  username: 'operative',
  displayName: 'Mock Operative',
  isAdmin: false,
};

export const mockEvents: ApiEvent[] = [
  {
    id: 'mock-event',
    name: 'BreachPoint Web CTF (Mock)',
    slug: 'breachpoint-2026-r1',
    description: 'A local, in-memory CTF board for frontend development.',
    startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isPublished: true,
    isFrozen: false,
  },
];

export const mockTeam: ApiTeam = {
  id: 'mock-team',
  name: 'Local Operatives',
  joinCode: 'MOCK42',
  eventId: 'mock-event',
  myRole: 'captain',
};

export const mockCategories = [
  { id: 1, name: 'Web' },
  { id: 2, name: 'Cryptography' },
  { id: 3, name: 'Forensics' },
  { id: 4, name: 'Reverse Engineering' },
  { id: 5, name: 'Pwn' },
];

export const mockChallengeFlags: Record<string, string> = {
  'mock-web-01': 'BreachPoint{view_source}',
  'mock-crypto-02': 'BreachPoint{shift_by_three}',
  'mock-forensics-03': 'BreachPoint{metadata_matters}',
  'mock-re-04': 'BreachPoint{read_the_strings}',
  'mock-pwn-05': 'BreachPoint{controlled_input}',
};

/** All mock challenges are directly playable; solves and score live in memory. */
export const mockBoard: ApiBoard = {
  team: { id: mockTeam.id, name: mockTeam.name },
  score: 0,
  rank: 1,
  solveCount: 0,
  pathScores: { A: 0, standalone: 0 },
  paths: [
    {
      id: 'mock-path-a',
      code: 'A',
      name: 'Web CTF',
      delivers: 'who',
      introNarration: 'Explore the mock CTF challenges.',
      isActive: true,
      isAttempted: true,
      isAvailable: true,
      rewardMultiplier: '1.00',
      entryReason: 'mock',
      solved: 0,
      total: 5,
      points: 0,
      isCompleted: false,
    },
  ],
  path: {
    id: 'mock-path-a',
    code: 'A',
    name: 'Web CTF',
    delivers: 'who',
    introNarration: 'Explore the mock CTF challenges.',
    rewardMultiplier: '1.00',
    entryReason: 'mock',
    solved: 0,
    total: 5,
    isCompleted: false,
  },
  challenges: [
    {
      id: 'mock-web-01', pathId: 'mock-path-a', pathCode: 'A', sequence: 1,
      title: 'Source of the Signal',
      description: 'Mock challenge. Submit BreachPoint{view_source} to solve it.',
      categoryId: 1, difficulty: 'easy', initialPoints: 100, minPoints: 100,
      currentPoints: 100, solves: 0, maxAttempts: null, author: 'Mock CTF',
      tier: 'present', status: 'open',
    },
    {
      id: 'mock-crypto-02', pathId: 'mock-path-a', pathCode: 'A', sequence: 2,
      title: 'Shifted Message',
      description: 'Mock challenge. Submit BreachPoint{shift_by_three} to solve it.',
      categoryId: 2, difficulty: 'easy', initialPoints: 150, minPoints: 100,
      currentPoints: 150, solves: 0, maxAttempts: null, author: 'Mock CTF',
      tier: 'present', status: 'open',
    },
    {
      id: 'mock-forensics-03', pathId: 'mock-path-a', pathCode: 'A', sequence: 3,
      title: 'Metadata Trail',
      description: 'Mock challenge. Submit BreachPoint{metadata_matters} to solve it.',
      categoryId: 3, difficulty: 'medium', initialPoints: 200, minPoints: 100,
      currentPoints: 200, solves: 0, maxAttempts: null, author: 'Mock CTF',
      tier: 'present', status: 'open',
    },
    {
      id: 'mock-re-04', pathId: 'mock-path-a', pathCode: 'A', sequence: 4,
      title: 'Strings Attached',
      description: 'Mock challenge. Submit BreachPoint{read_the_strings} to solve it.',
      categoryId: 4, difficulty: 'hard', initialPoints: 300, minPoints: 150,
      currentPoints: 300, solves: 0, maxAttempts: null, author: 'Mock CTF',
      tier: 'future', status: 'open',
    },
    {
      id: 'mock-pwn-05', pathId: 'mock-path-a', pathCode: 'A', sequence: 5,
      title: 'Controlled Input',
      description: 'Mock challenge. Submit BreachPoint{controlled_input} to solve it.',
      categoryId: 5, difficulty: 'expert', initialPoints: 500, minPoints: 200,
      currentPoints: 500, solves: 0, maxAttempts: null, author: 'Mock CTF',
      tier: 'future', status: 'open',
    },
  ],
  standalone: [],
  timeGlitch: { active: null, next: null },
};
