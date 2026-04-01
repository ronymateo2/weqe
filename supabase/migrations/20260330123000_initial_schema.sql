create extension if not exists pgcrypto;

create table public.dy_users (
  id text not null,
  name text null,
  email text null,
  "emailVerified" timestamp with time zone null,
  image text null,
  timezone text not null default 'America/Bogota'::text,
  created_at timestamp with time zone not null default now(),
  constraint dy_users_pkey primary key (id),
  constraint dy_users_email_key unique (email)
) TABLESPACE pg_default;

create table public.dy_accounts (
  "userId" text not null,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text null,
  access_token text null,
  expires_at integer null,
  token_type text null,
  scope text null,
  id_token text null,
  session_state text null,
  constraint dy_accounts_pkey primary key (provider, "providerAccountId"),
  constraint dy_accounts_userId_fkey foreign KEY ("userId") references dy_users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.dy_sessions (
  "sessionToken" text not null,
  "userId" text not null,
  expires timestamp with time zone not null,
  constraint dy_sessions_pkey primary key ("sessionToken"),
  constraint dy_sessions_userId_fkey foreign KEY ("userId") references dy_users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.dy_verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamp with time zone not null,
  constraint dy_verification_tokens_pkey primary key (identifier, token)
) TABLESPACE pg_default;

create table public.dy_check_ins (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  logged_at timestamp with time zone not null default now(),
  time_of_day text not null,
  eyelid_pain integer not null,
  temple_pain integer not null,
  masseter_pain integer not null,
  overall_pain integer not null,
  sleep_hours numeric(3, 1) null,
  sleep_quality integer null,
  notes text null,
  constraint dy_check_ins_pkey primary key (id),
  constraint dy_check_ins_user_id_fkey foreign KEY (user_id) references dy_users (id) on delete CASCADE,
  constraint dy_check_ins_overall_pain_check check (
    (
      (overall_pain >= 0)
      and (overall_pain <= 10)
    )
  ),
  constraint dy_check_ins_eyelid_pain_check check (
    (
      (eyelid_pain >= 0)
      and (eyelid_pain <= 10)
    )
  ),
  constraint dy_check_ins_sleep_quality_check check (
    (
      (sleep_quality >= 0)
      and (sleep_quality <= 10)
    )
  ),
  constraint dy_check_ins_temple_pain_check check (
    (
      (temple_pain >= 0)
      and (temple_pain <= 10)
    )
  ),
  constraint dy_check_ins_time_of_day_check check (
    (
      time_of_day = any (
        array['morning'::text, 'evening'::text, 'other'::text]
      )
    )
  ),
  constraint dy_check_ins_sleep_hours_check check (
    (
      (sleep_hours >= (0)::numeric)
      and (sleep_hours <= (24)::numeric)
    )
  ),
  constraint dy_check_ins_masseter_pain_check check (
    (
      (masseter_pain >= 0)
      and (masseter_pain <= 10)
    )
  )
) TABLESPACE pg_default;

create index IF not exists dy_check_ins_user_id_logged_at_idx on public.dy_check_ins using btree (user_id, logged_at) TABLESPACE pg_default;

create index IF not exists dy_check_ins_user_id_time_of_day_idx on public.dy_check_ins using btree (user_id, time_of_day) TABLESPACE pg_default;

create table public.dy_drop_types (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  name text not null,
  constraint dy_drop_types_pkey primary key (id),
  constraint dy_drop_types_user_id_name_key unique (user_id, name),
  constraint dy_drop_types_user_id_fkey foreign KEY (user_id) references dy_users (id) on delete CASCADE,
  constraint dy_drop_types_name_check check ((char_length(name) <= 100))
) TABLESPACE pg_default;

create index IF not exists dy_drop_types_user_id_idx on public.dy_drop_types using btree (user_id) TABLESPACE pg_default;

create table public.dy_drops (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  drop_type_id uuid not null,
  logged_at timestamp with time zone not null default now(),
  quantity integer not null,
  eye text not null,
  notes text null,
  constraint dy_drops_pkey primary key (id),
  constraint dy_drops_drop_type_id_fkey foreign KEY (drop_type_id) references dy_drop_types (id) on delete RESTRICT,
  constraint dy_drops_user_id_fkey foreign KEY (user_id) references dy_users (id) on delete CASCADE,
  constraint dy_drops_eye_check check (
    (
      eye = any (array['left'::text, 'right'::text, 'both'::text])
    )
  ),
  constraint dy_drops_quantity_check check ((quantity > 0))
) TABLESPACE pg_default;

create index IF not exists dy_drops_user_id_logged_at_idx on public.dy_drops using btree (user_id, logged_at) TABLESPACE pg_default;

create table public.dy_triggers (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  logged_at timestamp with time zone not null default now(),
  trigger_type text not null,
  intensity integer not null,
  notes text null,
  constraint dy_triggers_pkey primary key (id),
  constraint dy_triggers_user_id_fkey foreign KEY (user_id) references dy_users (id) on delete CASCADE,
  constraint dy_triggers_intensity_check check (
    (
      (intensity >= 1)
      and (intensity <= 3)
    )
  ),
  constraint dy_triggers_trigger_type_check check (
    (
      trigger_type = any (
        array[
          'climate'::text,
          'humidifier'::text,
          'stress'::text,
          'screens'::text,
          'tv'::text,
          'ergonomics'::text,
          'exercise'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists dy_triggers_user_id_logged_at_idx on public.dy_triggers using btree (user_id, logged_at) TABLESPACE pg_default;

