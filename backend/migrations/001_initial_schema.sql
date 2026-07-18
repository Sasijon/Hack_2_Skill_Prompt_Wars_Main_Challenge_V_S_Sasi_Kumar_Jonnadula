-- HabitHeal Initial Schema
-- Run this in Supabase SQL Editor (Project Settings > SQL Editor)
-- Supabase Auth handles the auth.users table automatically.

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Habits ──────────────────────────────────────────────────────────────────
create table if not exists public.habits (
    id                  uuid primary key default uuid_generate_v4(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    name                text not null check (char_length(name) <= 100),
    description         text check (char_length(description) <= 500),
    category            text not null check (category in ('screen_time', 'substance', 'eating', 'custom')),
    daily_goal          numeric,
    goal_unit           text check (char_length(goal_unit) <= 20),
    target_start_date   date,
    is_active           boolean not null default true,
    current_streak      integer not null default 0,
    longest_streak      integer not null default 0,
    nudge_frequency     text not null default 'gentle' check (nudge_frequency in ('off', 'gentle', 'regular')),
    expo_push_token     text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- ─── Logs ────────────────────────────────────────────────────────────────────
create table if not exists public.logs (
    id          uuid primary key default uuid_generate_v4(),
    habit_id    uuid not null references public.habits(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    log_date    date not null,
    value       numeric not null default 0,
    intensity   integer not null check (intensity between 1 and 5),
    notes       text check (char_length(notes) <= 1000),
    slipped     boolean not null default false,
    created_at  timestamptz not null default now(),
    -- Prevent duplicate logs for the same habit on the same day
    unique (habit_id, log_date)
);

-- ─── Chat Messages ───────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    habit_id    uuid references public.habits(id) on delete set null,
    role        text not null check (role in ('user', 'assistant')),
    content     text not null,
    created_at  timestamptz not null default now()
);

-- ─── Nudges ──────────────────────────────────────────────────────────────────
create table if not exists public.nudges (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    habit_id    uuid references public.habits(id) on delete set null,
    message     text not null,
    sent_at     timestamptz not null default now(),
    opened      boolean not null default false
);

-- ─── Insights ────────────────────────────────────────────────────────────────
create table if not exists public.insights (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    week_start      date not null,
    summary         text not null,
    recommendations jsonb not null default '[]'::jsonb,
    generated_at    timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists logs_habit_id_idx on public.logs(habit_id);
create index if not exists logs_user_id_date_idx on public.logs(user_id, log_date);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists nudges_user_id_idx on public.nudges(user_id);
create index if not exists nudges_sent_at_idx on public.nudges(sent_at);
create index if not exists insights_user_id_idx on public.insights(user_id);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Users can only access their own data.

alter table public.habits enable row level security;
alter table public.logs enable row level security;
alter table public.chat_messages enable row level security;
alter table public.nudges enable row level security;
alter table public.insights enable row level security;

-- Habits RLS
create policy "Users can manage their own habits"
    on public.habits for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Logs RLS
create policy "Users can manage their own logs"
    on public.logs for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Chat Messages RLS
create policy "Users can manage their own chat messages"
    on public.chat_messages for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Nudges RLS
create policy "Users can read their own nudges"
    on public.nudges for select
    using (auth.uid() = user_id);

create policy "Service role can insert nudges"
    on public.nudges for insert
    with check (true);  -- Backend uses service role key

create policy "Users can update their own nudges (mark opened)"
    on public.nudges for update
    using (auth.uid() = user_id);

-- Insights RLS
create policy "Users can read their own insights"
    on public.insights for select
    using (auth.uid() = user_id);

create policy "Service role can insert insights"
    on public.insights for insert
    with check (true);  -- Backend uses service role key
