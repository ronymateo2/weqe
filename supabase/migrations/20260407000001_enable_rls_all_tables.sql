-- Enable RLS on all tables (defense in depth)
-- Service role key (used in Server Actions) bypasses RLS.
-- Direct anon/public access is fully denied.

alter table public.dy_users enable row level security;
alter table public.dy_accounts enable row level security;
alter table public.dy_sessions enable row level security;
alter table public.dy_verification_tokens enable row level security;
alter table public.dy_check_ins enable row level security;
alter table public.dy_drop_types enable row level security;
alter table public.dy_drops enable row level security;
alter table public.dy_triggers enable row level security;

create policy "deny all direct access" on public.dy_users using (false);
create policy "deny all direct access" on public.dy_accounts using (false);
create policy "deny all direct access" on public.dy_sessions using (false);
create policy "deny all direct access" on public.dy_verification_tokens using (false);
create policy "deny all direct access" on public.dy_check_ins using (false);
create policy "deny all direct access" on public.dy_drop_types using (false);
create policy "deny all direct access" on public.dy_drops using (false);
create policy "deny all direct access" on public.dy_triggers using (false);
