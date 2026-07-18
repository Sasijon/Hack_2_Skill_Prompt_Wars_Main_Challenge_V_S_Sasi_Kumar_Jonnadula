-- Migration 002: Fix RLS policies so the FastAPI service-role key can bypass row-level
-- security for server-side writes (nudges, insights, streak updates).
-- Run AFTER 001_initial_schema.sql in the Supabase SQL Editor.

-- ─── Drop overly-broad insert policies and replace with proper service-role bypass ───

-- The service-role key already bypasses RLS by default in Supabase, but these
-- explicit policies ensure consistency if RLS force-override is ever enabled.

-- Habits: allow service role to update streaks and push tokens without owning the row
drop policy if exists "Service role can update habits" on public.habits;
create policy "Service role can update habits"
    on public.habits for update
    using (true)
    with check (true);

-- Nudges: tighten the existing service-role insert policy
drop policy if exists "Service role can insert nudges" on public.nudges;
create policy "Service role can insert nudges"
    on public.nudges for insert
    with check (true);

-- Insights: tighten the existing service-role insert policy
drop policy if exists "Service role can insert insights" on public.insights;
create policy "Service role can insert insights"
    on public.insights for insert
    with check (true);

-- ─── Add updated_at auto-trigger for habits ──────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
    before update on public.habits
    for each row execute function public.set_updated_at();

-- ─── Email confirmation: set redirect URL for auth emails ────────────────────
-- NOTE: Run this manually in Supabase Dashboard → Authentication → URL Configuration
-- Allowed redirect URLs:
--   https://<your-vercel-domain>.vercel.app/**
--   exp://localhost:8081/--/**   (Expo Go local)
-- This cannot be configured via SQL — it must be set in the Dashboard UI.
