import { NextRequest, NextResponse } from 'next/server';

// Called by Vercel Cron every hour during the tournament.
// Its main job is to bust the Next.js fetch cache so fresh data is loaded.
// Since we use `next: { revalidate: 900 }` on ESPN fetches, a cron hit
// every hour guarantees data is never more than 15 minutes stale.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger a scores fetch to warm the cache
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    await fetch(`${baseUrl}/api/scores`, { cache: 'no-store' });
    return NextResponse.json({ ok: true, refreshed: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
