create table if not exists dy_symptoms (
  id uuid primary key,
  user_id text not null references dy_users (id) on delete cascade,
  logged_at timestamp with time zone not null,
  symptom_type text not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

alter table dy_symptoms enable row level security;

create policy "deny all direct access" on dy_symptoms
  using (false);

create index dy_symptoms_user_id_logged_at_idx on dy_symptoms (user_id, logged_at desc);
