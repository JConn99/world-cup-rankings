import { createClient } from '@supabase/supabase-js';
import { ManualAdjustment } from './types';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? '';

// Returns null if env vars aren't set (graceful degradation during dev)
function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function getAdjustments(): Promise<ManualAdjustment[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('manual_adjustments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase getAdjustments error:', error.message);
    return [];
  }

  return (data ?? []).map(row => ({
    id:         row.id,
    teamName:   row.team_name,
    playerName: row.player_name,
    points:     row.points,
    reason:     row.reason ?? '',
    createdAt:  row.created_at,
  }));
}

export async function addAdjustment(
  teamName: string,
  playerName: string,
  points: number,
  reason: string,
): Promise<ManualAdjustment | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('manual_adjustments')
    .insert({ team_name: teamName, player_name: playerName, points, reason })
    .select()
    .single();

  if (error) {
    console.error('Supabase addAdjustment error:', error.message);
    return null;
  }

  return {
    id:         data.id,
    teamName:   data.team_name,
    playerName: data.player_name,
    points:     data.points,
    reason:     data.reason ?? '',
    createdAt:  data.created_at,
  };
}

export async function deleteAdjustment(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client
    .from('manual_adjustments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteAdjustment error:', error.message);
    return false;
  }
  return true;
}
