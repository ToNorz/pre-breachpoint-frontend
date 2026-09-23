import { ViewType } from '../types';

export interface ParsedRoute {
  view: ViewType;
  /** Display code of a challenge, e.g. "A-07". Never a server UUID. */
  slot: string | null;
}

/**
 * Hash routing (works on any static host, no server rewrites needed).
 *
 *   #/gate  #/login  #/team  #/dashboard
 *   #/challenge/A-07  #/board
 *
 * Challenge links carry the slot code rather than the server id: a slot is
 * short, stable across re-seeds and meaningful to a player reading the URL,
 * whereas a UUID is none of those. The context resolves the slot to the id it
 * needs when it calls the API.
 */
export function viewToHash(view: ViewType, slot?: string | null): string {
  switch (view) {
    case 'GATE': return '#/gate';
    case 'LOGIN': return '#/login';
    case 'TEAM': return '#/team';
    case 'DASHBOARD': return '#/dashboard';

    case 'CHALLENGE': return slot ? `#/challenge/${slot}` : '#/challenge';
    case 'BOARD': return '#/board';
    case 'ADMIN': return '#/admin';
    case 'ADMIN_EVENTS': return '#/admin/events';
    case 'ADMIN_CHALLENGES': return '#/admin/challenges';
    case 'ADMIN_GLITCHES': return '#/admin/glitches';
    case 'ADMIN_TEAMS': return '#/admin/teams';
    case 'ADMIN_ACTIVITY': return '#/admin/activity';
    case 'ADMIN_SPIN_WHEEL': return '#/admin/spin-wheel';
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
    case 'gate': return { view: 'GATE', slot: null };
    case 'login': return { view: 'LOGIN', slot: null };
    case 'team': return { view: 'TEAM', slot: null };
    case 'dashboard':
    case 'incident':
    case 'paths': return { view: 'DASHBOARD', slot: null };
    case 'challenge':
      if (param && /^A-\d{2}$/.test(param)) {
        return { view: 'CHALLENGE', slot: param };
      }
      return { view: 'DASHBOARD', slot: null };
    case 'board': return { view: 'BOARD', slot: null };
    case 'admin':
      switch (param) {
        case 'events': return { view: 'ADMIN_EVENTS', slot: null };
        case 'challenges': return { view: 'ADMIN_CHALLENGES', slot: null };
        case 'glitches': return { view: 'ADMIN_GLITCHES', slot: null };
        case 'teams': return { view: 'ADMIN_TEAMS', slot: null };
        case 'activity': return { view: 'ADMIN_ACTIVITY', slot: null };
        case 'spin-wheel': return { view: 'ADMIN_SPIN_WHEEL', slot: null };
        case 'leaderboard': return { view: 'ADMIN_LEADERBOARD', slot: null };
        default: return { view: 'ADMIN', slot: null };
      }
    default: return null;
  }
}
