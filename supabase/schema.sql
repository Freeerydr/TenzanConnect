-- ============================================================================
-- Tenzan Connect — Supabase schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
-- It creates every table, the admin-role helper, and Row-Level Security policies
-- that mirror the access rules the app already enforces.
-- ============================================================================

-- pgcrypto provides gen_random_uuid() (enabled by default on Supabase)
create extension if not exists pgcrypto;

-- Drop ALL existing policies in the public schema so this script is fully
-- idempotent and can be re-run safely after partial executions.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

-- Auto-update updated_date on every row change
create or replace function set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- User roles (mirrors the built-in Base44 User.role field)
-- ----------------------------------------------------------------------------
create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  full_name text,
  email text,
  created_date timestamptz not null default now()
);

-- True when the current authenticated user has the admin role
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
alter table user_roles enable row level security;
-- Any authenticated user can read the roster; writes go through the service
-- role (admin API / edge functions) — no client-write policy.
create policy "user_roles read" on user_roles
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- Core entity tables
-- ----------------------------------------------------------------------------

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  content text,
  author_name text,
  image_url text,
  category text default 'general',
  poll_options text[],
  likes_count integer default 0,
  comments_count integer default 0,
  is_announcement boolean default false,
  pinned boolean default false,
  event_id text
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  content text,
  post_id text,
  author_name text
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  participant_ids text[],
  participant_names text[],
  last_message text,
  last_message_date timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  conversation_id text,
  content text,
  sender_id text,
  sender_name text,
  participant_ids text[]
);

create table if not exists group_messages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  group_id text,
  content text,
  author_name text
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  user_id text,
  user_name text,
  bio text,
  avatar_url text,
  belt text default 'white',
  stripes integer default 0,
  training_days text[]
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  title text,
  notes text,
  techniques text,
  partners text,
  intensity text default 'moderate',
  duration_minutes integer,
  mood text default 'good',
  training_date date,
  ai_feedback text
);

create table if not exists techniques (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  name text,
  status text default 'learning',
  category text default 'other',
  notes text
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  title text,
  type text default 'session_count',
  target numeric,
  current numeric default 0,
  deadline date,
  completed boolean default false
);

create table if not exists partner_notes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  name text,
  notes text
);

create table if not exists rolls (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  training_date date,
  partner_name text,
  position text default 'guard',
  submission text,
  outcome text default 'neutral',
  notes text
);

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  name text,
  event_date date,
  location text,
  weight_class text,
  status text default 'planning',
  focus_areas text,
  result text,
  "placing" text,
  medal_shape text default 'medal',
  notes text
);

create table if not exists belt_promotions (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  user_id text,
  user_name text,
  belt text default 'white',
  stripes integer default 0,
  promotion_date date,
  notes text
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  user_id text,
  user_name text,
  kind text default 'mat_hours',
  title text,
  description text,
  icon text,
  threshold numeric,
  earned_date date,
  competition_id text,
  competition_name text,
  "placing" text,
  medal_shape text default 'medal'
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  weight numeric,
  log_date date,
  notes text
);

create table if not exists injuries (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  title text,
  injury_date date,
  body_part text,
  severity text default 'minor',
  status text default 'active',
  treatment text,
  expected_return date,
  resolved_date date,
  notes text
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  user_id text,
  user_name text,
  session_date date,
  class_name text
);

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  user_id text,
  user_name text,
  check_in_date date
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  title text,
  description text,
  event_date timestamptz,
  location text,
  capacity integer
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  event_id text,
  attendee_name text
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  follower_id text,
  following_id text,
  follower_name text,
  following_name text,
  type text default 'follow'
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  post_id text,
  option_index integer
);

create table if not exists quotes_of_the_week (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  text text,
  author text,
  quotes jsonb
);

create table if not exists techniques_of_the_week (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  title text,
  description text,
  image_url text
);

-- ----------------------------------------------------------------------------
-- updated_date triggers on all tables
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array[
    'user_roles','posts','comments','conversations','messages','group_messages',
    'profiles','journal_entries','techniques','goals','partner_notes','rolls',
    'competitions','belt_promotions','achievements','weight_logs','injuries',
    'attendance','check_ins','events','event_rsvps','connections','poll_votes',
    'quotes_of_the_week','techniques_of_the_week'
  ]) loop
    execute format(
      'drop trigger if exists trg_%s_updated on %I; create trigger trg_%s_updated before update on %I for each row execute function set_updated_date();',
      t, t, t, t
    );
  end loop;
end $$;

-- ============================================================================
-- Row-Level Security (mirrors the app's existing access rules)
-- ============================================================================

alter table posts enable row level security;
alter table comments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table group_messages enable row level security;
alter table profiles enable row level security;
alter table journal_entries enable row level security;
alter table techniques enable row level security;
alter table goals enable row level security;
alter table partner_notes enable row level security;
alter table rolls enable row level security;
alter table competitions enable row level security;
alter table belt_promotions enable row level security;
alter table achievements enable row level security;
alter table weight_logs enable row level security;
alter table injuries enable row level security;
alter table attendance enable row level security;
alter table check_ins enable row level security;
alter table events enable row level security;
alter table event_rsvps enable row level security;
alter table connections enable row level security;
alter table poll_votes enable row level security;
alter table quotes_of_the_week enable row level security;
alter table techniques_of_the_week enable row level security;

-- Posts: public read/create; owner or admin can update/delete
create policy "posts read"   on posts for select to authenticated using (true);
create policy "posts create" on posts for insert to authenticated with check (true);
create policy "posts update" on posts for update to authenticated using (created_by_id = auth.uid() or is_admin()) with check (created_by_id = auth.uid() or is_admin());
create policy "posts delete" on posts for delete to authenticated using (created_by_id = auth.uid() or is_admin());

-- Comments: public read/create; owner updates; owner or admin deletes
create policy "comments read"   on comments for select to authenticated using (true);
create policy "comments create" on comments for insert to authenticated with check (true);
create policy "comments update" on comments for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "comments delete" on comments for delete to authenticated using (created_by_id = auth.uid() or is_admin());

-- Conversations: only participants
create policy "conversations read"   on conversations for select to authenticated using (auth.uid()::text = any(participant_ids));
create policy "conversations create" on conversations for insert to authenticated with check (auth.uid()::text = any(participant_ids));
create policy "conversations update" on conversations for update to authenticated using (auth.uid()::text = any(participant_ids)) with check (auth.uid()::text = any(participant_ids));
create policy "conversations delete" on conversations for delete to authenticated using (created_by_id = auth.uid());

-- Messages: only participants
create policy "messages read"   on messages for select to authenticated using (auth.uid()::text = any(participant_ids));
create policy "messages create" on messages for insert to authenticated with check (auth.uid()::text = any(participant_ids));
create policy "messages update" on messages for update to authenticated using (created_by_id = auth.uid() or is_admin()) with check (true);
create policy "messages delete" on messages for delete to authenticated using (created_by_id = auth.uid() or is_admin());

-- Group messages: public read/create; owner or admin update/delete
create policy "group_messages read"   on group_messages for select to authenticated using (true);
create policy "group_messages create" on group_messages for insert to authenticated with check (true);
create policy "group_messages update" on group_messages for update to authenticated using (created_by_id = auth.uid() or is_admin()) with check (true);
create policy "group_messages delete" on group_messages for delete to authenticated using (created_by_id = auth.uid() or is_admin());

-- Profiles: public read; owner creates/updates/deletes (scoped by user_id)
create policy "profiles read"   on profiles for select to authenticated using (true);
create policy "profiles create" on profiles for insert to authenticated with check (user_id = auth.uid()::text);
create policy "profiles update" on profiles for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "profiles delete" on profiles for delete to authenticated using (created_by_id = auth.uid());

-- Owner-only entities (journal, techniques, goals, partners, rolls, competitions, weight, injuries)
create policy "journal_entries all owner" on journal_entries for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "techniques all owner" on techniques for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "goals all owner" on goals for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "partner_notes all owner" on partner_notes for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "rolls all owner" on rolls for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "competitions all owner" on competitions for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "weight_logs all owner" on weight_logs for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "injuries all owner" on injuries for all to authenticated
  using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());

-- Belt promotions: public read; admin-only write
create policy "belt_promotions read"   on belt_promotions for select to authenticated using (true);
create policy "belt_promotions create" on belt_promotions for insert to authenticated with check (is_admin());
create policy "belt_promotions update" on belt_promotions for update to authenticated using (is_admin()) with check (is_admin());
create policy "belt_promotions delete" on belt_promotions for delete to authenticated using (is_admin());

-- Achievements: public read; owner creates/updates/deletes (scoped by user_id)
create policy "achievements read"   on achievements for select to authenticated using (true);
create policy "achievements create" on achievements for insert to authenticated with check (user_id = auth.uid()::text);
create policy "achievements update" on achievements for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "achievements delete" on achievements for delete to authenticated using (created_by_id = auth.uid());

-- Attendance: owner or admin read; owner or admin create; admin update/delete
create policy "attendance read"   on attendance for select to authenticated using (user_id = auth.uid()::text or is_admin());
create policy "attendance create" on attendance for insert to authenticated with check (user_id = auth.uid()::text or is_admin());
create policy "attendance update" on attendance for update to authenticated using (is_admin()) with check (is_admin());
create policy "attendance delete" on attendance for delete to authenticated using (is_admin());

-- Check-ins: public read; owner creates/updates/deletes
create policy "check_ins read"   on check_ins for select to authenticated using (true);
create policy "check_ins create" on check_ins for insert to authenticated with check (user_id = auth.uid()::text);
create policy "check_ins update" on check_ins for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "check_ins delete" on check_ins for delete to authenticated using (created_by_id = auth.uid());

-- Events: public read; admin-only write
create policy "events read"   on events for select to authenticated using (true);
create policy "events create" on events for insert to authenticated with check (is_admin());
create policy "events update" on events for update to authenticated using (is_admin()) with check (is_admin());
create policy "events delete" on events for delete to authenticated using (is_admin());

-- Event RSVPs: public read; owner creates/updates/deletes
create policy "event_rsvps read"   on event_rsvps for select to authenticated using (true);
create policy "event_rsvps create" on event_rsvps for insert to authenticated with check (true);
create policy "event_rsvps update" on event_rsvps for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "event_rsvps delete" on event_rsvps for delete to authenticated using (created_by_id = auth.uid());

-- Connections: public read; follower creates/updates/deletes
create policy "connections read"   on connections for select to authenticated using (true);
create policy "connections create" on connections for insert to authenticated with check (follower_id = auth.uid()::text);
create policy "connections update" on connections for update to authenticated using (follower_id = auth.uid()::text) with check (follower_id = auth.uid()::text);
create policy "connections delete" on connections for delete to authenticated using (follower_id = auth.uid()::text);

-- Poll votes: public read; owner creates/updates/deletes
create policy "poll_votes read"   on poll_votes for select to authenticated using (true);
create policy "poll_votes create" on poll_votes for insert to authenticated with check (true);
create policy "poll_votes update" on poll_votes for update to authenticated using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
create policy "poll_votes delete" on poll_votes for delete to authenticated using (created_by_id = auth.uid());

-- Quotes of the week: public read; admin-only write
create policy "quotes_of_the_week read"   on quotes_of_the_week for select to authenticated using (true);
create policy "quotes_of_the_week create" on quotes_of_the_week for insert to authenticated with check (is_admin());
create policy "quotes_of_the_week update" on quotes_of_the_week for update to authenticated using (is_admin()) with check (is_admin());
create policy "quotes_of_the_week delete" on quotes_of_the_week for delete to authenticated using (is_admin());

-- Technique of the week: public read; admin-only write
create policy "techniques_of_the_week read"   on techniques_of_the_week for select to authenticated using (true);
create policy "techniques_of_the_week create" on techniques_of_the_week for insert to authenticated with check (is_admin());
create policy "techniques_of_the_week update" on techniques_of_the_week for update to authenticated using (is_admin()) with check (is_admin());
create policy "techniques_of_the_week delete" on techniques_of_the_week for delete to authenticated using (is_admin());

-- ============================================================================
-- Auto-populate user_roles on signup (defaults to 'user')
-- ============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into user_roles (user_id, role, full_name, email)
  values (new.id, 'user', new.raw_user_meta_data->>'full_name', new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();