-- Migration: create rate_limits table for Edge Function IP rate limiting
-- Used by: supabase/functions/submit-lead/index.ts

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip          text        NOT NULL,
  action      text        NOT NULL DEFAULT 'submit_lead',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by IP + action + time window
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action_created
  ON public.rate_limits (ip, action, created_at DESC);

-- Auto-delete records older than 24 hours to keep the table small
-- (Supabase pg_cron or a periodic Edge Function call can handle this,
--  but the Edge Function itself only reads from the last 15 min window.)

-- Row Level Security: the table is only accessible via the service-role key
-- (used inside the Edge Function). Anon/authenticated roles have no access.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for anon or authenticated — service_role bypasses RLS entirely.
-- This means direct PostgREST calls from the frontend cannot read/write this table.

COMMENT ON TABLE public.rate_limits IS
  'Server-side IP rate limiting log for the submit-lead Edge Function.';
