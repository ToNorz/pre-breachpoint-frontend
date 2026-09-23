import type { PathId } from '../types';

/** The dashboard accent used by challenge and scoreboard views. */
export const TONE: Record<PathId, string> = { A: '#5ED6E3' };

export const isPathId = (code: string): code is PathId =>
  code === 'A';
