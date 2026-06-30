import { ESPNMatchDetail, MatchResult, MatchPointsBreakdown, PlayerScore, ScoreHistoryEntry, TeamMatchStats, TeamScore, TournamentRound } from './types';
import { PLAYERS, FIFA_RANKINGS } from './players';
import { ManualAdjustment } from './types';

// ─── Scoring constants ────────────────────────────────────────────────────────

export const SCORING = {
  win:              5,
  draw:             2,
  loss:             0,
  goalScored:       2,
  cleanSheet:       2,
  yellowCard:       1,
  redCard:          3,
  advancement: {
    group:        10,  // advance from group stage
    round_of_32:  15,
    round_of_16:  20,
    quarterfinal: 30,
    semifinal:    40,
    third_place:  25,
    final:        50,
  } as Record<TournamentRound, number>,
  upset: {
    small:   3,   // ranking diff 10–25
    medium:  6,   // ranking diff 26–50
    large:   10,  // ranking diff 51+
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRoundLabel(round: TournamentRound): string {
  const labels: Record<TournamentRound, string> = {
    group:        'Group Stage',
    round_of_32:  'Round of 32',
    round_of_16:  'Round of 16',
    quarterfinal: 'Quarterfinal',
    semifinal:    'Semifinal',
    third_place:  'Third Place',
    final:        'Final',
  };
  return labels[round] ?? round;
}

const ROUND_ORDER: TournamentRound[] = [
  'group',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
];

function roundIndex(round: TournamentRound): number {
  return ROUND_ORDER.indexOf(round);
}

function calcUpsetBonus(winnerTeam: string, loserTeam: string): number {
  const winnerRank = FIFA_RANKINGS[winnerTeam];
  const loserRank = FIFA_RANKINGS[loserTeam];
  if (!winnerRank || !loserRank) return 0;
  // Upset means the higher-ranked (worse) team beats the lower-ranked (better) team
  const diff = winnerRank - loserRank;
  if (diff <= 0) return 0; // not an upset
  if (diff >= 51) return SCORING.upset.large;
  if (diff >= 26) return SCORING.upset.medium;
  if (diff >= 10) return SCORING.upset.small;
  return 0;
}

function calcMatchPoints(
  goalsScored: number,
  goalsConceded: number,
  yellowCards: number,
  redCards: number,
  result: MatchResult,
  cleanSheet: boolean,
  upsetBonus: number,
  advancementBonus: number,
): MatchPointsBreakdown {
  const resultPts = result === 'win' ? SCORING.win : result === 'draw' ? SCORING.draw : SCORING.loss;
  const goalPts = goalsScored * SCORING.goalScored;
  const cleanSheetPts = cleanSheet ? SCORING.cleanSheet : 0;
  const cardPts = yellowCards * SCORING.yellowCard + redCards * SCORING.redCard;

  return {
    result:      resultPts,
    goals:       goalPts,
    cleanSheet:  cleanSheetPts,
    cards:       cardPts,
    advancement: advancementBonus,
    upset:       upsetBonus,
    total:       resultPts + goalPts + cleanSheetPts + cardPts + advancementBonus + upsetBonus,
  };
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function calculatePlayerScores(
  matches: ESPNMatchDetail[],
  adjustments: ManualAdjustment[],
): PlayerScore[] {
  const completedMatches = matches.filter(m => m.completed);

  return PLAYERS.map(player => {
    const teamNames = [player.tier1, player.tier2, player.tier3];

    const teams: TeamScore[] = teamNames.map(teamName => {
      // Find all matches involving this team
      const teamMatches = completedMatches.filter(
        m => m.homeTeam === teamName || m.awayTeam === teamName,
      );

      // Determine which rounds this team has appeared in (for advancement bonus)
      const roundsAppeared = new Set(teamMatches.map(m => m.round));

      // For each round this team played in (beyond group stage), credit advancement points
      // Advancement credit is given in the first match of each knockout round
      // e.g. appearing in round_of_32 means they advanced from the group stage (+10)
      // winning round_of_32 means they appear in round_of_16 → credit in first r16 match, etc.
      const advancementCreditByRound = new Map<TournamentRound, number>();
      for (const round of roundsAppeared) {
        if (round === 'group') continue;
        // Credit the advancement that got them INTO this round
        const prevRound: TournamentRound = round === 'round_of_32' ? 'group'
          : round === 'round_of_16'   ? 'round_of_32'
          : round === 'quarterfinal'  ? 'round_of_16'
          : round === 'semifinal'     ? 'quarterfinal'
          : round === 'third_place'   ? 'semifinal'
          : 'semifinal'; // final
        advancementCreditByRound.set(round, SCORING.advancement[prevRound]);
      }
      // For the final winner specifically (won the final)
      const wonFinal = teamMatches.some(
        m => m.round === 'final' && (
          (m.homeTeam === teamName && m.homeScore > m.awayScore) ||
          (m.awayTeam === teamName && m.awayScore > m.homeScore)
        ),
      );
      if (wonFinal) {
        advancementCreditByRound.set('final', SCORING.advancement['final']);
      }
      // Third place winner
      const wonThird = teamMatches.some(
        m => m.round === 'third_place' && (
          (m.homeTeam === teamName && m.homeScore > m.awayScore) ||
          (m.awayTeam === teamName && m.awayScore > m.homeScore)
        ),
      );
      if (wonThird) {
        advancementCreditByRound.set('third_place', SCORING.advancement['third_place']);
      }

      // Track which rounds have already had their advancement credit assigned
      const advancementCreditUsed = new Set<TournamentRound>();

      // Sort matches chronologically
      const sortedMatches = [...teamMatches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const matchStats: TeamMatchStats[] = sortedMatches.map(match => {
        const isHome = match.homeTeam === teamName;
        const goalsScored = isHome ? match.homeScore : match.awayScore;
        const goalsConceded = isHome ? match.awayScore : match.homeScore;
        const yellowCards = isHome ? match.homeYellowCards : match.awayYellowCards;
        const redCards = isHome ? match.homeRedCards : match.awayRedCards;
        const opponent = isHome ? match.awayTeam : match.homeTeam;

        let result: MatchResult;
        if (match.penaltyWinner) {
          // Penalty shootout: use ESPN's winner flag, ignore tied scoreline
          const teamSide = isHome ? 'home' : 'away';
          result = match.penaltyWinner === teamSide ? 'win' : 'loss';
        } else if (goalsScored > goalsConceded) result = 'win';
        else if (goalsScored < goalsConceded) result = 'loss';
        else result = 'draw';

        const cleanSheet = goalsConceded === 0;

        // Upset bonus (only on wins)
        const upsetBonus = result === 'win' ? calcUpsetBonus(teamName, opponent) : 0;

        // Advancement bonus: credit on first match of each new round
        let advancementBonus = 0;
        if (!advancementCreditUsed.has(match.round)) {
          advancementCreditUsed.add(match.round);
          advancementBonus = advancementCreditByRound.get(match.round) ?? 0;
        }

        const points = calcMatchPoints(
          goalsScored,
          goalsConceded,
          yellowCards,
          redCards,
          result,
          cleanSheet,
          upsetBonus,
          advancementBonus,
        );

        return {
          matchId: match.matchId,
          matchDate: match.date,
          opponent,
          round: match.round,
          result,
          goalsScored,
          goalsConceded,
          yellowCards,
          redCards,
          cleanSheet,
          upsetBonus,
          advancementBonus,
          points,
        };
      });

      // Aggregate
      const totalPoints = matchStats.reduce((s, m) => s + m.points.total, 0);
      const wins = matchStats.filter(m => m.result === 'win').length;
      const draws = matchStats.filter(m => m.result === 'draw').length;
      const losses = matchStats.filter(m => m.result === 'loss').length;
      const totalGoals = matchStats.reduce((s, m) => s + m.goalsScored, 0);
      const totalYellowCards = matchStats.reduce((s, m) => s + m.yellowCards, 0);
      const totalRedCards = matchStats.reduce((s, m) => s + m.redCards, 0);
      const totalCleanSheets = matchStats.filter(m => m.cleanSheet).length;
      const resultPoints = matchStats.reduce((s, m) => s + m.points.result, 0);
      const goalPoints = matchStats.reduce((s, m) => s + m.points.goals, 0);
      const cleanSheetPoints = matchStats.reduce((s, m) => s + m.points.cleanSheet, 0);
      const cardPoints = matchStats.reduce((s, m) => s + m.points.cards, 0);
      const advancementPoints = matchStats.reduce((s, m) => s + m.points.advancement, 0);
      const upsetPoints = matchStats.reduce((s, m) => s + m.points.upset, 0);

      // Current highest round reached
      const roundsSorted = ROUND_ORDER.filter(r => roundsAppeared.has(r));
      const currentRound = roundsSorted[roundsSorted.length - 1] ?? null;

      return {
        teamName,
        matches: matchStats,
        totalPoints,
        wins,
        draws,
        losses,
        totalGoals,
        totalYellowCards,
        totalRedCards,
        totalCleanSheets,
        resultPoints,
        goalPoints,
        cleanSheetPoints,
        cardPoints,
        advancementPoints,
        upsetPoints,
        currentRound,
      } as TeamScore;
    });

    // Manual adjustments for this player
    const playerAdjustments = adjustments.filter(a => a.playerName === player.name);
    const manualAdjustmentPoints = playerAdjustments.reduce((s, a) => s + a.points, 0);

    const teamTotalPoints = teams.reduce((s, t) => s + t.totalPoints, 0);
    const totalPoints = teamTotalPoints + manualAdjustmentPoints;

    // Aggregate across teams
    const totalGoals = teams.reduce((s, t) => s + t.totalGoals, 0);
    const totalYellowCards = teams.reduce((s, t) => s + t.totalYellowCards, 0);
    const totalRedCards = teams.reduce((s, t) => s + t.totalRedCards, 0);
    const totalCleanSheets = teams.reduce((s, t) => s + t.totalCleanSheets, 0);
    const wins = teams.reduce((s, t) => s + t.wins, 0);
    const draws = teams.reduce((s, t) => s + t.draws, 0);
    const losses = teams.reduce((s, t) => s + t.losses, 0);
    const resultPoints = teams.reduce((s, t) => s + t.resultPoints, 0);
    const goalPoints = teams.reduce((s, t) => s + t.goalPoints, 0);
    const cleanSheetPoints = teams.reduce((s, t) => s + t.cleanSheetPoints, 0);
    const cardPoints = teams.reduce((s, t) => s + t.cardPoints, 0);
    const advancementPoints = teams.reduce((s, t) => s + t.advancementPoints, 0);
    const upsetPoints = teams.reduce((s, t) => s + t.upsetPoints, 0);

    // Score history: combine all team matches, sort by date, accumulate
    const allMatchEvents: Array<{ date: string; points: number; label: string }> = [];
    for (const team of teams) {
      for (const m of team.matches) {
        allMatchEvents.push({
          date: m.matchDate,
          points: m.points.total,
          label: `${team.teamName} vs ${m.opponent}`,
        });
      }
    }
    // Add manual adjustments (use createdAt as date)
    for (const adj of playerAdjustments) {
      allMatchEvents.push({
        date: adj.createdAt,
        points: adj.points,
        label: `Manual: ${adj.reason || 'Admin adjustment'}`,
      });
    }
    allMatchEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    const scoreHistory: ScoreHistoryEntry[] = allMatchEvents.map(ev => {
      cumulative += ev.points;
      return {
        date: ev.date.split('T')[0],
        cumulativePoints: cumulative,
        matchLabel: ev.label,
      };
    });

    return {
      playerName: player.name,
      tier1: player.tier1,
      tier2: player.tier2,
      tier3: player.tier3,
      teams,
      totalPoints,
      manualAdjustmentPoints,
      manualAdjustments: playerAdjustments,
      totalGoals,
      totalYellowCards,
      totalRedCards,
      totalCleanSheets,
      wins,
      draws,
      losses,
      resultPoints,
      goalPoints,
      cleanSheetPoints,
      cardPoints,
      advancementPoints,
      upsetPoints,
      scoreHistory,
    } as PlayerScore;
  });
}
