import { NextRequest, NextResponse } from 'next/server';
import { addAdjustment, deleteAdjustment, getAdjustments } from '@/lib/supabase';
import { PLAYERS } from '@/lib/players';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'BTWW2026';

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('x-admin-password');
  return auth === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const adjustments = await getAdjustments();
  return NextResponse.json({ adjustments });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { teamName, playerName, points, reason } = body as {
    teamName?: string;
    playerName?: string;
    points?: unknown;
    reason?: string;
  };

  if (!teamName || !playerName || points === undefined) {
    return NextResponse.json({ error: 'teamName, playerName, and points are required' }, { status: 400 });
  }

  const pts = Number(points);
  if (isNaN(pts)) {
    return NextResponse.json({ error: 'points must be a number' }, { status: 400 });
  }

  // Validate playerName exists
  const playerExists = PLAYERS.some(p => p.name === playerName);
  if (!playerExists) {
    return NextResponse.json({ error: `Unknown player: ${playerName}` }, { status: 400 });
  }

  // Validate team belongs to player
  const player = PLAYERS.find(p => p.name === playerName)!;
  const playerTeams = [player.tier1, player.tier2, player.tier3];
  if (!playerTeams.includes(teamName)) {
    return NextResponse.json(
      { error: `Team "${teamName}" does not belong to player "${playerName}"` },
      { status: 400 },
    );
  }

  const adjustment = await addAdjustment(teamName, playerName, pts, reason ?? '');
  if (!adjustment) {
    return NextResponse.json({ error: 'Failed to save adjustment (Supabase not configured?)' }, { status: 500 });
  }

  return NextResponse.json({ adjustment }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const success = await deleteAdjustment(id);
  if (!success) {
    return NextResponse.json({ error: 'Failed to delete adjustment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
