'use client';

import { useState, useEffect, useCallback } from 'react';
import { PLAYERS } from '@/lib/players';
import { ManualAdjustment } from '@/lib/types';

const TIER_LABEL: Record<number, string> = { 0: 'Tier 1', 1: 'Tier 2', 2: 'Tier 3' };

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[0].name);
  const [selectedTeam, setSelectedTeam] = useState(PLAYERS[0].tier1);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([]);
  const [loadingAdj, setLoadingAdj] = useState(false);

  const currentPlayer = PLAYERS.find(p => p.name === selectedPlayer)!;
  const playerTeams = [
    { team: currentPlayer.tier1, label: `Tier 1 — ${currentPlayer.tier1}` },
    { team: currentPlayer.tier2, label: `Tier 2 — ${currentPlayer.tier2}` },
    { team: currentPlayer.tier3, label: `Tier 3 — ${currentPlayer.tier3}` },
  ];

  const loadAdjustments = useCallback(async (pwd: string) => {
    setLoadingAdj(true);
    try {
      const res = await fetch('/api/admin/adjustments', {
        headers: { 'x-admin-password': pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments ?? []);
      }
    } finally {
      setLoadingAdj(false);
    }
  }, []);

  function handlePlayerChange(name: string) {
    setSelectedPlayer(name);
    const p = PLAYERS.find(pl => pl.name === name)!;
    setSelectedTeam(p.tier1);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    // Verify by making a real API call
    const res = await fetch('/api/admin/adjustments', {
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError('');
      loadAdjustments(password);
    } else {
      setAuthError('Incorrect password.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);

    const pts = parseInt(points, 10);
    if (isNaN(pts)) {
      setSubmitMsg({ type: 'err', text: 'Points must be a valid integer.' });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ teamName: selectedTeam, playerName: selectedPlayer, points: pts, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg({ type: 'ok', text: `Added ${pts > 0 ? '+' : ''}${pts} pts to ${selectedTeam} (${selectedPlayer}).` });
        setPoints('');
        setReason('');
        loadAdjustments(password);
      } else {
        setSubmitMsg({ type: 'err', text: data.error ?? 'Failed to add adjustment.' });
      }
    } catch {
      setSubmitMsg({ type: 'err', text: 'Network error.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/adjustments?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      loadAdjustments(password);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Enter the admin password to continue.</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter password"
              required
            />
          </div>
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <button
          onClick={() => { setAuthed(false); setPassword(''); }}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Add adjustment form */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-white">Add Manual Point Adjustment</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Player</label>
            <select
              value={selectedPlayer}
              onChange={e => handlePlayerChange(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {PLAYERS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Team</label>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {playerTeams.map(({ team, label }) => (
                <option key={team} value={team}>{label}</option>
              ))}
            </select>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Points (can be negative)</label>
            <input
              type="number"
              value={points}
              onChange={e => setPoints(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. 5 or -3"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. Bonus for group stage goal difference"
            />
          </div>

          {submitMsg && (
            <p className={`text-sm ${submitMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {submitMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Adding…' : 'Add Adjustment'}
          </button>
        </form>
      </div>

      {/* Existing adjustments */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Existing Adjustments</h2>
        {loadingAdj && <p className="text-sm text-zinc-500">Loading…</p>}
        {!loadingAdj && adjustments.length === 0 && (
          <p className="text-sm text-zinc-600">No manual adjustments yet.</p>
        )}
        {!loadingAdj && adjustments.length > 0 && (
          <div className="space-y-2">
            {adjustments.map(adj => (
              <div key={adj.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                <div>
                  <span className="text-white font-medium">{adj.playerName}</span>
                  <span className="text-zinc-500 mx-1">·</span>
                  <span className="text-zinc-400">{adj.teamName}</span>
                  {adj.reason && <span className="text-zinc-600 ml-2">— {adj.reason}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={adj.points >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {adj.points > 0 ? `+${adj.points}` : adj.points}
                  </span>
                  <button
                    onClick={() => handleDelete(adj.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
