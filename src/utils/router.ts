import { PathId, ViewType } from '../types';

export interface ParsedRoute {
  view: ViewType;
  /** Display code of a challenge, e.g. "A-07". Never a server UUID. */
  slot: string | null;
  pathId: PathId | null;
}

/**
 * Hash routing (works on any static host, no server rewrites needed).
 *
 *   #/gate  #/login  #/team  #/dashboard
 *   #/map  #/path/B  #/challenge/A-07  #/rite  #/board
 *
 * Challenge links carry the slot code rather than the server id: a slot is
 * short, stable across re-seeds and meaningful to a player reading the URL,
 * whereas a UUID is none of those. The context resolves the slot to the id it
 * needs when it calls the API.
 */
export function viewToHash(view: ViewType, slot?: string | null, pathId?: PathId): string {
  switch (view) {
    case 'GATE': return '#/gate';
    case 'LOGIN': return '#/login';
    case 'TEAM': return '#/team';
    case 'DASHBOARD': return '#/dashboard';
    case 'MAP': return pathId ? `#/map/${pathId}` : '#/map';
    case 'TRAIL': return pathId ? `#/path/${pathId}` : '#/dashboard';
    case 'CHALLENGE': return slot ? `#/challenge/${slot}` : '#/challenge';
    case 'CONVERGENCE': return '#/rite';
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
  const asPath = (p?: string): PathId | null =>
    p === 'A' || p === 'B' || p === 'C' ? p : null;

  switch (head) {
    case 'gate': return { view: 'GATE', slot: null, pathId: null };
    case 'login': return { view: 'LOGIN', slot: null, pathId: null };
    case 'team': return { view: 'TEAM', slot: null, pathId: null };
    case 'dashboard':
    case 'incident':
    case 'paths': return { view: 'DASHBOARD', slot: null, pathId: null };
    case 'map': return { view: 'MAP', slot: null, pathId: asPath(param) };
    case 'path': case 'trail': {
      const p = asPath(param);
      return p ? { view: 'TRAIL', slot: null, pathId: p } : { view: 'MAP', slot: null, pathId: null };
    }
    case 'challenge':
      if (param && /^[ABC]-\d{2}$/.test(param)) {
        return { view: 'CHALLENGE', slot: param, pathId: asPath(param[0]) };
      }
      return { view: 'MAP', slot: null, pathId: null };
    case 'rite':
    case 'convergence': return { view: 'CONVERGENCE', slot: null, pathId: null };
    case 'board': return { view: 'BOARD', slot: null, pathId: null };
    case 'admin':
      switch (param) {
        case 'events': return { view: 'ADMIN_EVENTS', slot: null, pathId: null };
        case 'challenges': return { view: 'ADMIN_CHALLENGES', slot: null, pathId: null };
        case 'glitches': return { view: 'ADMIN_GLITCHES', slot: null, pathId: null };
        case 'teams': return { view: 'ADMIN_TEAMS', slot: null, pathId: null };
        case 'activity': return { view: 'ADMIN_ACTIVITY', slot: null, pathId: null };
        case 'spin-wheel': return { view: 'ADMIN_SPIN_WHEEL', slot: null, pathId: null };
        case 'leaderboard': return { view: 'ADMIN_LEADERBOARD', slot: null, pathId: null };
        default: return { view: 'ADMIN', slot: null, pathId: null };
      }
    default: return null;
  }
}
