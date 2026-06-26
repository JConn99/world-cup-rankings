-- Run this in your Supabase project's SQL Editor
-- https://supabase.com/dashboard/project/_/sql

CREATE TABLE manual_adjustments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name   text NOT NULL,
  player_name text NOT NULL,
  points      integer NOT NULL,
  reason      text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Optional: index for quick lookups by player
CREATE INDEX manual_adjustments_player_idx ON manual_adjustments(player_name);
