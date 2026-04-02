alter table public.dy_check_ins
  add column cervical_pain integer not null default 0,
  add column orbital_pain integer not null default 0;

alter table public.dy_check_ins
  add constraint dy_check_ins_cervical_pain_check check (
    (cervical_pain >= 0) and (cervical_pain <= 10)
  ),
  add constraint dy_check_ins_orbital_pain_check check (
    (orbital_pain >= 0) and (orbital_pain <= 10)
  );
