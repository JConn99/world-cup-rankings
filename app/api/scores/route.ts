import { NextResponse } from 'next/server';
import { fetchAllMatches } from '@/lib/espn';
import { getAdjustments } from '@/lib/supabase';
import { calculatePlayerScores } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [matches, adjustments] = await Promise.all([
      fetchAllMatches(),
      getAdjustments(),
    ]);

    const scores = calculatePlayerScores(matches, adjustments);
    scores.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({ scores, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching scores:', err);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}
