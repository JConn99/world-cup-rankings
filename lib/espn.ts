import { ESPNMatchDetail, TournamentRound } from './types';
import { normalizeTeamName } from './teamNames';
import { ALL_TEAMS } from './players';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
// The 2026 World Cup slug on ESPN. Update if ESPN uses a different identifier.
const LEAGUE_SLUG = process.env.ESPN_LEAGUE_SLUG ?? 'fifa.world';

// 2026 FIFA World Cup runs June 11 – July 19, 2026
const WC_START = '20260611';
const WC_END   = '20260719';

// ─── Round detection ──────────────────────────────────────────────────────────

// ESPN season slugs observed in 2026 World Cup API responses
const SEASON_SLUG_MAP: Record<string, TournamentRound> = {
  'group-stage':   'group',
  'round-of-32':   'round_of_32',
  'round-of-16':   'round_of_16',
  'quarterfinals': 'quarterfinal',
  'quarter-finals':'quarterfinal',
  'semifinals':    'semifinal',
  'semi-finals':   'semifinal',
  'third-place':   'third_place',
  'third-place-match': 'third_place',
  'final':         'final',
};

function detectRound(seasonSlug: string, eventName: string, notes: string[]): TournamentRound {
  // Primary: use ESPN's season slug (reliable, observed in API)
  const slugKey = seasonSlug.toLowerCase();
  if (SEASON_SLUG_MAP[slugKey]) return SEASON_SLUG_MAP[slugKey];

  // Fallback: text-based detection from name/notes
  const text = [eventName, ...notes].join(' ').toLowerCase();
  if (text.includes('final') && !text.includes('semi') && !text.includes('quarter') && !text.includes('third')) {
    return 'final';
  }
  if (text.includes('third') || text.includes('3rd')) return 'third_place';
  if (text.includes('semi'))                            return 'semifinal';
  if (text.includes('quarter'))                         return 'quarterfinal';
  if (text.includes('round of 16') || text.includes('last 16')) return 'round_of_16';
  if (text.includes('round of 32') || text.includes('last 32')) return 'round_of_32';

  return 'group';
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchESPN<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 900 }, // 15-minute cache
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorldCupTracker/1.0)' },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── Scoreboard: get all event IDs ───────────────────────────────────────────

interface ScoreboardResponse {
  events?: Array<{
    id: string;
    name: string;
    date: string;
    season?: { type?: number; slug?: string };
    status: { type: { completed: boolean; description: string } };
    competitions: Array<{
      competitors: Array<{
        homeAway: string;
        team: { displayName: string };
        score: string;
        winner?: boolean;
      }>;
      notes?: Array<{ type: string; headline: string }>;
    }>;
  }>;
}

async function fetchScoreboard(): Promise<ScoreboardResponse['events']> {
  const url = `${ESPN_BASE}/${LEAGUE_SLUG}/scoreboard?dates=${WC_START}-${WC_END}&limit=200`;
  const data = await fetchESPN<ScoreboardResponse>(url);
  return data?.events ?? [];
}

// ─── Match summary: get card stats ───────────────────────────────────────────

interface PlayerStat {
  name: string;
  value: number;
}

interface RosterEntry {
  stats?: PlayerStat[];
}

interface SummaryResponse {
  rosters?: Array<{
    homeAway: 'home' | 'away';
    team: { displayName: string };
    roster?: RosterEntry[];
  }>;
}

interface CardStats {
  yellowCards: number;
  redCards: number;
}

function sumStat(roster: RosterEntry[], statName: string): number {
  return roster.reduce((total, player) => {
    const stat = (player.stats ?? []).find(s => s.name === statName);
    return total + (stat?.value ?? 0);
  }, 0);
}

function parseCardStatsByHomeAway(
  summary: SummaryResponse,
): { home: CardStats; away: CardStats } {
  const empty = { yellowCards: 0, redCards: 0 };
  if (!summary.rosters) return { home: empty, away: empty };

  const result: { home: CardStats; away: CardStats } = { home: empty, away: empty };

  for (const rosterGroup of summary.rosters) {
    const side = rosterGroup.homeAway;
    const players = rosterGroup.roster ?? [];
    result[side] = {
      yellowCards: Math.round(sumStat(players, 'yellowCards')),
      redCards:    Math.round(sumStat(players, 'redCards')),
    };
  }

  return result;
}

async function fetchMatchCards(eventId: string) {
  const url = `${ESPN_BASE}/${LEAGUE_SLUG}/summary?event=${eventId}`;
  const summary = await fetchESPN<SummaryResponse>(url);
  if (!summary) {
    return { homeYellow: 0, homeRed: 0, awayYellow: 0, awayRed: 0 };
  }
  const { home, away } = parseCardStatsByHomeAway(summary);
  return { homeYellow: home.yellowCards, homeRed: home.redCards, awayYellow: away.yellowCards, awayRed: away.redCards };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchAllMatches(): Promise<ESPNMatchDetail[]> {
  const events = await fetchScoreboard();
  if (!events || events.length === 0) return [];

  const ourTeamsSet = new Set(ALL_TEAMS);

  // Filter to matches involving at least one of our tracked teams
  const relevantEvents = events.filter(event => {
    const comp = event.competitions?.[0];
    if (!comp) return false;
    return comp.competitors.some(c => {
      const norm = normalizeTeamName(c.team?.displayName ?? '');
      return norm && ourTeamsSet.has(norm);
    });
  });

  // Fetch card data for completed matches in parallel (batched to avoid overwhelming ESPN)
  const BATCH_SIZE = 10;
  const results: ESPNMatchDetail[] = [];

  for (let i = 0; i < relevantEvents.length; i += BATCH_SIZE) {
    const batch = relevantEvents.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async event => {
        const comp = event.competitions?.[0];
        if (!comp) return null;

        const homeComp = comp.competitors.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors.find(c => c.homeAway === 'away');
        if (!homeComp || !awayComp) return null;

        const homeRaw = homeComp.team?.displayName ?? '';
        const awayRaw = awayComp.team?.displayName ?? '';
        const homeTeam = normalizeTeamName(homeRaw);
        const awayTeam = normalizeTeamName(awayRaw);

        // Only process matches where we track at least one team
        if ((!homeTeam || !ourTeamsSet.has(homeTeam)) && (!awayTeam || !ourTeamsSet.has(awayTeam))) {
          return null;
        }

        const homeScore = parseInt(homeComp.score ?? '0', 10) || 0;
        const awayScore = parseInt(awayComp.score ?? '0', 10) || 0;
        const completed = event.status?.type?.completed ?? false;

        const notes = (comp.notes ?? []).map(n => n.headline ?? '');
        const seasonSlug = event.season?.slug ?? '';
        const round = detectRound(seasonSlug, event.name, notes);

        let homeYellowCards = 0;
        let homeRedCards = 0;
        let awayYellowCards = 0;
        let awayRedCards = 0;

        if (completed) {
          const cards = await fetchMatchCards(event.id);
          homeYellowCards = cards.homeYellow;
          homeRedCards = cards.homeRed;
          awayYellowCards = cards.awayYellow;
          awayRedCards = cards.awayRed;
        }

        return {
          matchId: event.id,
          homeTeam: homeTeam ?? homeRaw,
          awayTeam: awayTeam ?? awayRaw,
          homeScore,
          awayScore,
          homeYellowCards,
          homeRedCards,
          awayYellowCards,
          awayRedCards,
          round,
          date: event.date,
          completed,
        } as ESPNMatchDetail;
      }),
    );

    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}
