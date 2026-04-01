-- Update default timezone and set all existing users to America/Bogota
alter table public.dy_users
  alter column timezone set default 'America/Bogota';

update public.dy_users
  set timezone = 'America/Bogota'
  where timezone = 'America/New_York';
