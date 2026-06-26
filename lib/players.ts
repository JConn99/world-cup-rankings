import { Player } from './types';

export const PLAYERS: Player[] = [
  { name: 'Barbs',      tier1: 'Netherlands', tier2: 'Iran',        tier3: 'Scotland'   },
  { name: 'Ben',        tier1: 'Germany',     tier2: 'Uruguay',     tier3: 'Canada'     },
  { name: 'Bryce',      tier1: 'Portugal',    tier2: 'South Korea', tier3: 'Panama'     },
  { name: 'Camindzend', tier1: 'England',     tier2: 'USA',         tier3: 'Iraq'       },
  { name: 'Dave',       tier1: 'Morocco',     tier2: 'Egypt',       tier3: 'Tunisia'    },
  { name: 'Hopper',     tier1: 'France',      tier2: 'Ecuador',     tier3: 'Sweden'     },
  { name: 'Joe',        tier1: 'Argentina',   tier2: 'Australia',   tier3: 'Norway'     },
  { name: 'Kleiss',     tier1: 'Brazil',      tier2: 'Japan',       tier3: 'Ivory Coast'},
  { name: 'Noah',       tier1: 'Colombia',    tier2: 'Mexico',      tier3: 'Qatar'      },
  { name: 'Peter',      tier1: 'Croatia',     tier2: 'Algeria',     tier3: 'Uzbekistan' },
  { name: 'Sam',        tier1: 'Senegal',     tier2: 'Austria',     tier3: 'DR Congo'   },
  { name: 'Takai',      tier1: 'Spain',       tier2: 'Turkey',      tier3: 'Czechia'    },
  { name: 'Trevor',     tier1: 'Belgium',     tier2: 'Switzerland', tier3: 'Paraguay'   },
];

// All team names in canonical form (must match keys in teamNames.ts)
export const ALL_TEAMS: string[] = PLAYERS.flatMap(p => [p.tier1, p.tier2, p.tier3]);

// Pre-tournament FIFA World Rankings (approximate, March 2026)
// Lower number = higher ranked. Used for upset bonus calculation.
export const FIFA_RANKINGS: Record<string, number> = {
  'Argentina':    1,
  'France':       2,
  'Spain':        3,
  'England':      4,
  'Brazil':       5,
  'Belgium':      6,
  'Portugal':     7,
  'Netherlands':  8,
  'Germany':      9,
  'Croatia':      10,
  'Colombia':     11,
  'Uruguay':      12,
  'Morocco':      13,
  'USA':          14,
  'Mexico':       15,
  'Switzerland':  16,
  'Japan':        17,
  'Senegal':      18,
  'Ecuador':      19,
  'Turkey':       20,
  'Australia':    21,
  'South Korea':  22,
  'Canada':       23,
  'Austria':      24,
  'Norway':       25,
  'Egypt':        26,
  'Algeria':      27,
  'Tunisia':      28,
  'Sweden':       29,
  'Paraguay':     30,
  'Panama':       31,
  'Ivory Coast':  32,
  'DR Congo':     33,
  'Uzbekistan':   34,
  'Iran':         35,
  'Czechia':      36,
  'Scotland':     37,
  'Iraq':         38,
  'Qatar':        39,
};
