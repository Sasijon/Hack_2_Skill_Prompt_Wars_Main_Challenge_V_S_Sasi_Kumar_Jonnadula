-- Migration 003: Demo seed data for evaluators
-- ⚠️  Run this ONLY after setting up a demo user via Supabase Auth Dashboard or
--     the signup flow. Replace the UUID below with the actual demo user's ID.
--
-- How to get the demo user ID:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Create / find the demo user (demo@habitheal.app)
--   3. Copy their UUID and replace DEMO_USER_ID below
--
-- Then run this script in the SQL Editor.

do $$
declare
    demo_user_id uuid;
    habit1_id    uuid := gen_random_uuid();
    habit2_id    uuid := gen_random_uuid();
    habit3_id    uuid := gen_random_uuid();
begin
    -- Resolve the demo user's UUID by email
    select id into demo_user_id
    from auth.users
    where email = 'demo@habitheal.app'
    limit 1;

    if demo_user_id is null then
        raise notice 'Demo user demo@habitheal.app not found — skipping seed. Create the user first.';
        return;
    end if;

    -- ── Habits ────────────────────────────────────────────────────────────────
    insert into public.habits (id, user_id, name, description, category, daily_goal, goal_unit,
                                is_active, current_streak, longest_streak, nudge_frequency)
    values
        (habit1_id, demo_user_id,
         'Reduce Social Media',
         'Cutting down Instagram and TikTok to reclaim focus time.',
         'screen_time', 30, 'minutes',
         true, 5, 12, 'gentle'),

        (habit2_id, demo_user_id,
         'Limit Junk Food',
         'Avoid processed snacks and fast food.',
         'eating', 1, 'times',
         true, 2, 7, 'regular'),

        (habit3_id, demo_user_id,
         'No Smoking',
         'Quit smoking entirely.',
         'substance', 0, 'cigarettes',
         true, 14, 14, 'gentle')
    on conflict (id) do nothing;

    -- ── Logs — last 14 days ───────────────────────────────────────────────────
    -- Social media habit: mostly resisted, one slip 5 days ago
    insert into public.logs (id, habit_id, user_id, log_date, value, intensity, notes, slipped)
    select
        gen_random_uuid(),
        habit1_id,
        demo_user_id,
        current_date - s.i,
        case when s.i = 5 then 65 else floor(random() * 25 + 10)::int end,
        case when s.i = 5 then 4 else floor(random() * 3 + 1)::int end,
        case when s.i = 5 then 'Was really stressed, opened Instagram without thinking.' else null end,
        s.i = 5
    from generate_series(0, 13) as s(i)
    on conflict (habit_id, log_date) do nothing;

    -- Junk food habit: logged 10 of 14 days, 3 slips
    insert into public.logs (id, habit_id, user_id, log_date, value, intensity, notes, slipped)
    select
        gen_random_uuid(),
        habit2_id,
        demo_user_id,
        current_date - s.i,
        case when s.i in (3, 7, 11) then 3 else 0 end,
        case when s.i in (3, 7, 11) then 4 else 2 end,
        null,
        s.i in (3, 7, 11)
    from generate_series(0, 13) as s(i)
    where s.i not in (1, 6, 9, 12)  -- skip 4 days (no log)
    on conflict (habit_id, log_date) do nothing;

    -- No smoking: 14-day clean streak
    insert into public.logs (id, habit_id, user_id, log_date, value, intensity, notes, slipped)
    select
        gen_random_uuid(),
        habit3_id,
        demo_user_id,
        current_date - s.i,
        0,
        case when s.i <= 3 then 2 else floor(random() * 2 + 1)::int end,
        case when s.i = 0 then 'Two weeks clean! Feeling proud.' else null end,
        false
    from generate_series(0, 13) as s(i)
    on conflict (habit_id, log_date) do nothing;

    -- ── Demo chat message ─────────────────────────────────────────────────────
    insert into public.chat_messages (id, user_id, habit_id, role, content)
    values
        (gen_random_uuid(), demo_user_id, habit1_id, 'user',
         'I slipped on my social media habit yesterday. I feel terrible about it.'),
        (gen_random_uuid(), demo_user_id, habit1_id, 'assistant',
         'One slip after 12 days of success is not failure — it is information. You were stressed and reached for a familiar comfort. That is human. The key is what you do today. Your 5-day current streak shows you bounced back fast. What made yesterday different, and what can we put in place for next time?')
    on conflict do nothing;

    raise notice 'Seed data inserted successfully for user %', demo_user_id;
end;
$$;
