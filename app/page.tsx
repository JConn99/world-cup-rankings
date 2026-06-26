import { fetchAllMatches } from '@/lib/espn';
import { getAdjustments } from '@/lib/supabase';
import { calculatePlayerScores } from '@/lib/scoring';
import { PlayerScore } from '@/lib/types';
import Link from 'next/link';
import { MultiPlayerChart } from '@/components/ScoreHistoryChart';
import { getRoundLabel } from '@/lib/scoring';

export const revalidate = 900; // revalidate every 15 minutes

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

function RankBadge({ rank }: { rank: number }) {
  if (rank < 3) {
    return <span className="text-lg">{MEDAL[rank]}</span>;
  }
  return (
    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 text-sm font-medium">
      {rank + 1}
    </span>
  );
}

function PointsBar({ points, max }: { points: number; max: number }) {
  const pct = max > 0 ? (points / max) * 100 : 0;
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
      <div
        className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function RankingsPage() {
  const [matches, adjustments] = await Promise.all([
    fetchAllMatches(),
    getAdjustments(),
  ]);

  const scores = calculatePlayerScores(matches, adjustments);
  scores.sort((a, b) => b.totalPoints - a.totalPoints);
  const maxPoints = scores[0]?.totalPoints ?? 1;

  const lastUpdated = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rankings</h1>
          <p className="text-zinc-500 text-sm mt-1">Updated {lastUpdated}</p>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <div>2026 FIFA World Cup</div>
          <div className="text-zinc-600">Jun 11 – Jul 19</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {scores.map((player, idx) => (
          <Link
            key={player.playerName}
            href={`/player/${encodeURIComponent(player.playerName)}`}
            className="block group"
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800/60 transition-all">
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex justify-center">
                <RankBadge rank={idx} />
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {player.playerName}
                  </span>
                  {player.teams.some(t => t.currentRound && t.currentRound !== 'group') && (
                    <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {getRoundLabel(player.teams.sort((a, b) => {
                        const order = ['group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final'];
                        return order.indexOf(b.currentRound ?? 'group') - order.indexOf(a.currentRound ?? 'group');
                      })[0].currentRound ?? 'group')}
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[player.tier1, player.tier2, player.tier3].map((team, ti) => {
                    const teamScore = player.teams[ti];
                    const alive = teamScore.currentRound !== null;
                    return (
                      <span
                        key={team}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          alive
                            ? 'border-zinc-600 text-zinc-300 bg-zinc-800'
                            : 'border-zinc-800 text-zinc-600 bg-zinc-900'
                        }`}
                      >
                        {team}
                      </span>
                    );
                  })}
                </div>

                {/* Points bar */}
                <PointsBar points={player.totalPoints} max={maxPoints} />
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-500 flex-shrink-0">
                <div className="text-center">
                  <div className="text-xs text-zinc-600">Goals</div>
                  <div>{player.totalGoals}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-600">W-D-L</div>
                  <div>{player.wins}-{player.draws}-{player.losses}</div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-white tabular-nums">
                  {player.totalPoints}
                </div>
                <div className="text-xs text-zinc-500">pts</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Score history chart */}
      <div className="rounded-xl bg-zinc-900 border border-white/5 p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Score History
        </h2>
        <MultiPlayerChart players={scores} />
      </div>

      {/* Scoring reference */}
      <div className="rounded-xl bg-zinc-900 border border-white/5 p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Scoring System
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1 text-sm">
          {[
            ['Win', '+5'],
            ['Draw', '+2'],
            ['Goal Scored', '+2'],
            ['Clean Sheet', '+2'],
            ['Yellow Card', '+1'],
            ['Red Card', '+3'],
            ['Advance from Groups', '+10'],
            ['Win Round of 32', '+15'],
            ['Win Round of 16', '+20'],
            ['Win Quarterfinal', '+30'],
            ['Win Semifinal', '+40'],
            ['Win Third Place', '+25'],
            ['Win the Final', '+50'],
            ['Upset (10–25 rank diff)', '+3'],
            ['Upset (26–50 rank diff)', '+6'],
            ['Upset (51+ rank diff)', '+10'],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between py-0.5 border-b border-white/5">
              <span className="text-zinc-400">{label}</span>
              <span className="font-medium text-emerald-400">{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
