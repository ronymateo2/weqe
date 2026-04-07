alter table public.dy_drop_types
  add column sort_order integer null;

create index if not exists dy_drop_types_user_id_sort_order_idx
  on public.dy_drop_types using btree (user_id, sort_order);
