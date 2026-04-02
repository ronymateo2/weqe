alter table public.dy_check_ins
  add column stress_level integer not null default 0;

alter table public.dy_check_ins
  add constraint dy_check_ins_stress_level_check check (
    (stress_level >= 0) and (stress_level <= 10)
  );
