'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PlayerScore, ScoreHistoryEntry } from '@/lib/types';

// Consistent palette for up to 13 players
const COLORS = [
  '#34d399', // emerald
  '#60a5fa', // blue
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#fb923c', // orange
  '#22d3ee', // cyan
  '#f87171', // red
  '#4ade80', // green
  '#e879f9', // fuchsia
  '#facc15', // yellow
  '#38bdf8', // sky
  '#c084fc', // purple
];

interface MultiPlayerChartProps {
  players: PlayerScore[];
}

interface SinglePlayerChartProps {
  history: ScoreHistoryEntry[];
  playerName: string;
}

// Build a unified date axis from all players' histories
function buildChartData(players: PlayerScore[]) {
  const dateSet = new Set<string>();
  for (const p of players) {
    for (const h of p.scoreHistory) {
      dateSet.add(h.date);
    }
  }
  const dates = Array.from(dateSet).sort();

  return dates.map(date => {
    const entry: Record<string, string | number> = { date };
    for (const p of players) {
      // Find last history entry on or before this date
      const relevant = p.scoreHistory.filter(h => h.date <= date);
      entry[p.playerName] = relevant.length > 0
        ? relevant[relevant.length - 1].cumulativePoints
        : 0;
    }
    return entry;
  });
}

export function MultiPlayerChart({ players }: MultiPlayerChartProps) {
  const activePlayers = players.filter(p => p.scoreHistory.length > 0);
  if (activePlayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        Score history will appear once matches begin.
      </div>
    );
  }

  const data = buildChartData(activePlayers);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={d => {
            const [, m, day] = d.split('-');
            return `${m}/${day}`;
          }}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={35} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#e4e4e7' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
        />
        {activePlayers.map((p, i) => (
          <Line
            key={p.playerName}
            type="monotone"
            dataKey={p.playerName}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SinglePlayerChart({ history, playerName }: SinglePlayerChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
        Score history will appear once matches begin.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={d => {
            const [, m, day] = d.split('-');
            return `${m}/${day}`;
          }}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={35} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#e4e4e7' }}
          formatter={(val) => [val, playerName]}
        />
        <Line
          type="monotone"
          dataKey="cumulativePoints"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ fill: '#34d399', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
