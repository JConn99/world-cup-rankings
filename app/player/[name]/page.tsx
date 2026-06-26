import { fetchAllMatches } from '@/lib/espn';
import { getAdjustments } from '@/lib/supabase';
import { calculatePlayerScores, getRoundLabel, SCORING } from '@/lib/scoring';
import { PlayerScore, TeamScore } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SinglePlayerChart } from '@/components/ScoreHistoryChart';
import { PLAYERS } from '@/lib/players';

export const revalidate = 900;

export async function generateStaticParams() {
  return PLAYERS.map(p => ({ name: encodeURIComponent(p.name) }));
}

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-emerald-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function PointsRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  if (value === 0) return null;
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-white/5 text-sm ${highlight ? 'text-white' : 'text-zinc-400'}`}>
      <span>{label}</span>
      <span className={highlight ? 'font-bold text-emerald-400' : 'text-zinc-300'}>{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}

function TeamCard({ team, allScores }: { team: TeamScore; allScores: PlayerScore[] }) {
  const hasMatches = team.matches.length > 0;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-lg">{team.teamName}</h3>
          {team.currentRound && (
            <span className="text-xs text-emerald-500">{getRoundLabel(team.currentRound)}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{team.totalPoints}</div>
          <div className="text-xs text-zinc-500">pts</div>
        </div>
      </div>

      {!hasMatches && (
        <p className="text-sm text-zinc-600">No matches played yet.</p>
      )}

      {hasMatches && (
        <>
          {/* Points breakdown */}
          <div className="mb-4">
            <PointsRow label="Results (W/D/L)" value={team.resultPoints} />
            <PointsRow label="Goals scored" value={team.goalPoints} />
            <PointsRow label="Clean sheets" value={team.cleanSheetPoints} />
            <PointsRow label="Cards (yellow/red)" value={team.cardPoints} />
            <PointsRow label="Advancement" value={team.advancementPoints} />
            <PointsRow label="Upset bonuses" value={team.upsetPoints} />
          </div>

          {/* Match log */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Match Log</div>
            {team.matches.map(m => (
              <div key={m.matchId} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 text-center font-medium rounded ${
                    m.result === 'win'  ? 'text-emerald-400' :
                    m.result === 'draw' ? 'text-yellow-400'  :
                                          'text-red-400'
                  }`}>
                    {m.result === 'win' ? 'W' : m.result === 'draw' ? 'D' : 'L'}
                  </span>
                  <span className="text-zinc-400">vs {m.opponent}</span>
                  <span className="text-zinc-600">{m.goalsScored}–{m.goalsConceded}</span>
                  {m.cleanSheet && <span className="text-blue-400" title="Clean sheet">CS</span>}
                  {m.yellowCards > 0 && <span className="text-yellow-400">{m.yellowCards}Y</span>}
                  {m.redCards > 0 && <span className="text-red-400">{m.redCards}R</span>}
                  {m.upsetBonus > 0 && <span className="text-purple-400" title="Upset bonus">↑</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600">{getRoundLabel(m.round)}</span>
                  <span className="text-white font-medium">+{m.points.total}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const playerName = decodeURIComponent(name);

  const [matches, adjustments] = await Promise.all([
    fetchAllMatches(),
    getAdjustments(),
  ]);

  const scores = calculatePlayerScores(matches, adjustments);
  scores.sort((a, b) => b.totalPoints - a.totalPoints);

  const player = scores.find(p => p.playerName === playerName);
  if (!player) notFound();

  const rank = scores.findIndex(p => p.playerName === playerName) + 1;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors">
        ← Rankings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{player.playerName}</h1>
          <p className="text-zinc-500 text-sm mt-1">Rank #{rank} of 13</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white">{player.totalPoints}</div>
          <div className="text-sm text-zinc-500">total points</div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatPill label="Wins" value={player.wins} />
        <StatPill label="Draws" value={player.draws} />
        <StatPill label="Losses" value={player.losses} />
        <StatPill label="Goals" value={player.totalGoals} sub={`+${player.goalPoints} pts`} />
        <StatPill label="Clean Sheets" value={player.totalCleanSheets} sub={`+${player.cleanSheetPoints} pts`} />
        <StatPill label="Cards" value={`${player.totalYellowCards}Y/${player.totalRedCards}R`} sub={`+${player.cardPoints} pts`} />
      </div>

      {/* Points breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Points Breakdown</h2>
          <PointsRow label="Match results"  value={player.resultPoints} />
          <PointsRow label="Goals"          value={player.goalPoints} />
          <PointsRow label="Clean sheets"   value={player.cleanSheetPoints} />
          <PointsRow label="Cards"          value={player.cardPoints} />
          <PointsRow label="Advancement"    value={player.advancementPoints} />
          <PointsRow label="Upset bonuses"  value={player.upsetPoints} />
          {player.manualAdjustmentPoints !== 0 && (
            <PointsRow label="Manual adjustments" value={player.manualAdjustmentPoints} />
          )}
          <div className="flex justify-between items-center pt-2 mt-1 text-sm font-bold text-white">
            <span>Total</span>
            <span className="text-emerald-400">{player.totalPoints} pts</span>
          </div>
        </div>

        {/* Score history */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Score History</h2>
          <SinglePlayerChart history={player.scoreHistory} playerName={player.playerName} />
        </div>
      </div>

      {/* Team cards */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Teams</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {player.teams.map(team => (
            <TeamCard key={team.teamName} team={team} allScores={scores} />
          ))}
        </div>
      </div>

      {/* Manual adjustments */}
      {player.manualAdjustments.length > 0 && (
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Admin Adjustments</h2>
          <div className="space-y-2">
            {player.manualAdjustments.map(adj => (
              <div key={adj.id} className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                <div>
                  <span className="text-zinc-300">{adj.teamName}</span>
                  {adj.reason && <span className="text-zinc-500 ml-2">— {adj.reason}</span>}
                </div>
                <span className={adj.points >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {adj.points > 0 ? `+${adj.points}` : adj.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
