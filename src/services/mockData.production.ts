import type { ApiBoard, ApiEvent, ApiTeam, AuthUser } from './api';

// Safe build-time replacement. The mock API is disabled in production; this
// fixture intentionally contains no challenge descriptions or flag answers.
export const mockUser: AuthUser = {
  id: 'mock-disabled',
  username: 'mock-disabled',
  displayName: 'Mock mode disabled',
  isAdmin: false,
};

export const mockEvents: ApiEvent[] = [];
export const mockTeam: ApiTeam = {
  id: 'mock-disabled',
  name: 'Mock mode disabled',
  joinCode: '',
  eventId: 'mock-disabled',
};
export const mockCategories: { id: number; name: string }[] = [];
export const mockChallengeFlags: Record<string, string> = {};
export const mockBoard: ApiBoard = {
  team: { id: mockTeam.id, name: mockTeam.name },
  score: 0,
  rank: null,
  solveCount: 0,
  pathScores: { A: 0, standalone: 0 },
  paths: [],
  path: null,
  challenges: [],
  standalone: [],
  timeGlitch: { active: null, next: null },
};
