create extension if not exists pgcrypto;

create table if not exists dy_users (
  id text primary key,
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

create table if not exists dy_accounts (
  user_id text not null references dy_users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  access_token text,
  refresh_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table if not exists dy_sessions (
  session_token text primary key,
  user_id text not null references dy_users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists dy_verification_tokens (
  identifier text not null,
  expires timestamptz not null,
  token text not null,
  primary key (identifier, token)
);

create table if not exists dy_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references dy_users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  time_of_day text not null check (time_of_day in ('morning', 'evening', 'other')),
  eyelid_pain int not null check (eyelid_pain between 0 and 10),
  temple_pain int not null check (temple_pain between 0 and 10),
  masseter_pain int not null check (masseter_pain between 0 and 10),
  overall_pain int not null check (overall_pain between 0 and 10),
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  sleep_quality int check (sleep_quality between 0 and 10),
  notes text
);

create table if not exists dy_drop_types (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references dy_users(id) on delete cascade,
  name text not null check (name = lower(trim(name)) and length(name) <= 100),
  unique (user_id, name)
);

create table if not exists dy_drops (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references dy_users(id) on delete cascade,
  drop_type_id uuid not null references dy_drop_types(id) on delete cascade,
  logged_at timestamptz not null default now(),
  quantity int not null check (quantity > 0),
  eye text not null check (eye in ('left', 'right', 'both')),
  notes text
);

create table if not exists dy_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references dy_users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  trigger_type text not null check (
    trigger_type in ('climate', 'humidifier', 'stress', 'screens', 'tv', 'ergonomics', 'exercise', 'other')
  ),
  intensity int not null check (intensity between 1 and 3),
  notes text
);

create index if not exists dy_check_ins_user_logged_at_idx on dy_check_ins (user_id, logged_at desc);
create index if not exists dy_drop_types_user_idx on dy_drop_types (user_id);
create index if not exists dy_drops_user_logged_at_idx on dy_drops (user_id, logged_at desc);
create index if not exists dy_triggers_user_logged_at_idx on dy_triggers (user_id, logged_at desc);

alter table dy_users enable row level security;
alter table dy_accounts enable row level security;
alter table dy_sessions enable row level security;
alter table dy_verification_tokens enable row level security;
alter table dy_check_ins enable row level security;
alter table dy_drop_types enable row level security;
alter table dy_drops enable row level security;
alter table dy_triggers enable row level security;

drop policy if exists "server only" on dy_users;
drop policy if exists "server only" on dy_accounts;
drop policy if exists "server only" on dy_sessions;
drop policy if exists "server only" on dy_verification_tokens;
drop policy if exists "server only" on dy_check_ins;
drop policy if exists "server only" on dy_drop_types;
drop policy if exists "server only" on dy_drops;
drop policy if exists "server only" on dy_triggers;

create policy "server only" on dy_users for all using (false) with check (false);
create policy "server only" on dy_accounts for all using (false) with check (false);
create policy "server only" on dy_sessions for all using (false) with check (false);
create policy "server only" on dy_verification_tokens for all using (false) with check (false);
create policy "server only" on dy_check_ins for all using (false) with check (false);
create policy "server only" on dy_drop_types for all using (false) with check (false);
create policy "server only" on dy_drops for all using (false) with check (false);
create policy "server only" on dy_triggers for all using (false) with check (false);

create or replace view users as select * from dy_users;
create or replace view accounts as select * from dy_accounts;
create or replace view sessions as select * from dy_sessions;
create or replace view verification_tokens as select * from dy_verification_tokens;
