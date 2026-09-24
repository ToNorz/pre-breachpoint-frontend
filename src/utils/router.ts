import { ViewType } from '../types';

export interface ParsedRoute {
  view: ViewType;
  /** Display code of a challenge, e.g. "A-07". Never a server UUID. */
  slot: string | null;
}

export function viewToHash(view: ViewType, slot?: string | null): string {
  switch (view) {
    case 'LOGIN': return '#/login';
    case 'TEAM': return '#/team';
    case 'DASHBOARD': return '#/dashboard';
    case 'CHALLENGE': return slot ? `#/challenge/${slot}` : '#/challenge';
    case 'BOARD': return '#/board';
    case 'ADMIN': return '#/admin';
    case 'ADMIN_CHALLENGES': return '#/admin/challenges';
    case 'ADMIN_TEAMS': return '#/admin/teams';
    case 'ADMIN_ACTIVITY': return '#/admin/activity';
    case 'ADMIN_LEADERBOARD': return '#/admin/leaderboard';
    default: return '#/dashboard';
  }
}

export function parseHash(hash: string): ParsedRoute | null {
  const clean = (hash || '').replace(/^#/, '');
  const segs = clean.split('/').filter(Boolean);
  if (segs.length === 0) return null;
  const [head, param] = segs;
  switch (head) {
    case 'login': return { view: 'LOGIN', slot: null };
    case 'team': return { view: 'TEAM', slot: null };
    case 'dashboard': return { view: 'DASHBOARD', slot: null };
    case 'challenge':
      if (param) return { view: 'CHALLENGE', slot: param };
      return { view: 'DASHBOARD', slot: null };
    case 'board': return { view: 'BOARD', slot: null };
    case 'admin':
      switch (param) {
        case 'challenges': return { view: 'ADMIN_CHALLENGES', slot: null };
        case 'teams': return { view: 'ADMIN_TEAMS', slot: null };
        case 'activity': return { view: 'ADMIN_ACTIVITY', slot: null };
        case 'leaderboard': return { view: 'ADMIN_LEADERBOARD', slot: null };
        default: return { view: 'ADMIN', slot: null };
      }
    default: return null;
  }
}
