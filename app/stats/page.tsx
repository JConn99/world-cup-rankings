import { fetchAllMatches } from '@/lib/espn';
import { getAdjustments } from '@/lib/supabase';
import { calculatePlayerScores } from '@/lib/scoring';
import { PlayerScore } from '@/lib/types';
import Link from 'next/link';

export const revalidate = 900;

interface StatCategory {
  id: string;
  label: string;
  description: string;
  getValue: (p: PlayerScore) => number;
  suffix?: string;
  color: string;
}

const CATEGORIES: StatCategory[] = [
  {
    id: 'goals',
    label: 'Most Goals',
    description: 'Total goals scored across all three teams',
    getValue: p => p.totalGoals,
    suffix: 'goals',
    color: 'text-emerald-400',
  },
  {
    id: 'clean_sheets',
    label: 'Most Clean Sheets',
    description: 'Games where your team conceded zero goals',
    getValue: p => p.totalCleanSheets,
    suffix: 'clean sheets',
    color: 'text-blue-400',
  },
  {
    id: 'yellow_cards',
    label: 'Most Yellow Cards',
    description: 'Yellow cards received (each worth +1 point)',
    getValue: p => p.totalYellowCards,
    suffix: 'yellows',
    color: 'text-yellow-400',
  },
  {
    id: 'red_cards',
    label: 'Most Red Cards',
    description: 'Red cards received (each worth +3 points)',
    getValue: p => p.totalRedCards,
    suffix: 'reds',
    color: 'text-red-400',
  },
  {
    id: 'wins',
    label: 'Most Wins',
    description: 'Total wins across all three teams',
    getValue: p => p.wins,
    suffix: 'wins',
    color: 'text-purple-400',
  },
  {
    id: 'advancement',
    label: 'Advancement Points',
    description: 'Points earned from teams advancing through the tournament',
    getValue: p => p.advancementPoints,
    suffix: 'pts',
    color: 'text-orange-400',
  },
  {
    id: 'upset',
    label: 'Upset Points',
    description: 'Points from beating higher-ranked teams',
    getValue: p => p.upsetPoints,
    suffix: 'pts',
    color: 'text-pink-400',
  },
  {
    id: 'cards_total',
    label: 'Most Card Points',
    description: 'Combined card points (yellow ×1, red ×3)',
    getValue: p => p.cardPoints,
    suffix: 'pts',
    color: 'text-amber-400',
  },
];

function CategoryTable({ category, players }: { category: StatCategory; players: PlayerScore[] }) {
  const sorted = [...players].sort((a, b) => category.getValue(b) - category.getValue(a));
  const max = category.getValue(sorted[0]) || 1;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-white">{category.label}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{category.description}</p>
      </div>

      <div className="space-y-2">
        {sorted.map((player, idx) => {
          const value = category.getValue(player);
          const pct = (value / max) * 100;
          return (
            <Link key={player.playerName} href={`/player/${encodeURIComponent(player.playerName)}`}>
              <div className="flex items-center gap-3 py-1 group">
                <span className="w-5 text-xs text-zinc-600 flex-shrink-0">{idx + 1}</span>
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors w-28 flex-shrink-0 truncate">
                  {player.playerName}
                </span>
                <div className="flex-1">
                  <div className="bg-zinc-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${category.color.replace('text-', 'bg-')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium flex-shrink-0 ${category.color} tabular-nums`}>
                  {value}
                  <span className="text-zinc-600 text-xs ml-1">{category.suffix}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Best single team (most points from one team)
function BestTeamTable({ players }: { players: PlayerScore[] }) {
  const teamRows = players.flatMap(p =>
    p.teams.map(t => ({ player: p.playerName, team: t.teamName, points: t.totalPoints }))
  ).sort((a, b) => b.points - a.points).slice(0, 13);

  const max = teamRows[0]?.points || 1;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-white">Best Individual Team</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Top performing single teams in the draft</p>
      </div>
      <div className="space-y-2">
        {teamRows.map((row, idx) => (
          <Link key={`${row.player}-${row.team}`} href={`/player/${encodeURIComponent(row.player)}`}>
            <div className="flex items-center gap-3 py-1 group">
              <span className="w-5 text-xs text-zinc-600 flex-shrink-0">{idx + 1}</span>
              <div className="w-28 flex-shrink-0">
                <div className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{row.team}</div>
                <div className="text-xs text-zinc-600">{row.player}</div>
              </div>
              <div className="flex-1">
                <div className="bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(row.points / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-emerald-400 tabular-nums flex-shrink-0">
                {row.points}<span className="text-zinc-600 text-xs ml-1">pts</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const [matches, adjustments] = await Promise.all([
    fetchAllMatches(),
    getAdjustments(),
  ]);

  const scores = calculatePlayerScores(matches, adjustments);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Stats</h1>
        <p className="text-zinc-500 text-sm mt-1">Category leaderboards across all players</p>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: scores.reduce((s, p) => s + p.totalGoals, 0), color: 'text-emerald-400' },
          { label: 'Yellow Cards', value: scores.reduce((s, p) => s + p.totalYellowCards, 0), color: 'text-yellow-400' },
          { label: 'Red Cards', value: scores.reduce((s, p) => s + p.totalRedCards, 0), color: 'text-red-400' },
          { label: 'Clean Sheets', value: scores.reduce((s, p) => s + p.totalCleanSheets, 0), color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-white/5 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category tables */}
      <div className="grid sm:grid-cols-2 gap-5">
        {CATEGORIES.map(cat => (
          <CategoryTable key={cat.id} category={cat} players={scores} />
        ))}
        <BestTeamTable players={scores} />
      </div>
    </div>
  );
}
