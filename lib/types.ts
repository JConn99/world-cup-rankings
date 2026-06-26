export interface Player {
  name: string;
  tier1: string;
  tier2: string;
  tier3: string;
}

export interface ManualAdjustment {
  id: string;
  teamName: string;
  playerName: string;
  points: number;
  reason: string;
  createdAt: string;
}

export type MatchResult = 'win' | 'loss' | 'draw';

export type TournamentRound =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third_place'
  | 'final';

export interface MatchPointsBreakdown {
  result: number;
  goals: number;
  cleanSheet: number;
  cards: number;
  advancement: number;
  upset: number;
  total: number;
}

export interface TeamMatchStats {
  matchId: string;
  matchDate: string; // ISO date string
  opponent: string;
  round: TournamentRound;
  result: MatchResult;
  goalsScored: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  cleanSheet: boolean;
  upsetBonus: number;
  advancementBonus: number; // points credited in this match for advancing to this round
  points: MatchPointsBreakdown;
}

export interface TeamScore {
  teamName: string;
  matches: TeamMatchStats[];
  totalPoints: number;
  // cumulative category totals
  wins: number;
  draws: number;
  losses: number;
  totalGoals: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalCleanSheets: number;
  // points by category
  resultPoints: number;
  goalPoints: number;
  cleanSheetPoints: number;
  cardPoints: number;
  advancementPoints: number;
  upsetPoints: number;
  currentRound: TournamentRound | null;
}

export interface ScoreHistoryEntry {
  date: string;
  cumulativePoints: number;
  matchLabel: string;
}

export interface PlayerScore {
  playerName: string;
  tier1: string;
  tier2: string;
  tier3: string;
  teams: TeamScore[];
  totalPoints: number;
  manualAdjustmentPoints: number;
  manualAdjustments: ManualAdjustment[];
  // aggregated across all three teams
  totalGoals: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalCleanSheets: number;
  wins: number;
  draws: number;
  losses: number;
  // points by category (summed across teams)
  resultPoints: number;
  goalPoints: number;
  cleanSheetPoints: number;
  cardPoints: number;
  advancementPoints: number;
  upsetPoints: number;
  scoreHistory: ScoreHistoryEntry[];
}

export interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
  };
  score: string;
  winner?: boolean;
  statistics?: Array<{
    name: string;
    displayValue: string;
  }>;
}

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  status: {
    type: {
      completed: boolean;
      description: string;
    };
  };
  competitions: Array<{
    id: string;
    competitors: ESPNCompetitor[];
    notes?: Array<{ type: string; headline: string }>;
    situation?: { lastPlay?: { text: string } };
  }>;
  season?: {
    type: number;
    slug: string;
  };
}

export interface ESPNMatchDetail {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  round: TournamentRound;
  date: string;
  completed: boolean;
}
