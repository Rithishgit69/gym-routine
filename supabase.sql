create table if not exists public.gym_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null check (store_name in ('checkins', 'logs', 'meta')),
  record_key text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, store_name, record_key)
);

create table if not exists public.gym_photos (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  storage_path text not null,
  bytes integer,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.gym_records enable row level security;
alter table public.gym_photos enable row level security;

drop policy if exists "Users manage their own records" on public.gym_records;
create policy "Users manage their own records"
  on public.gym_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own photo metadata" on public.gym_photos;
create policy "Users manage their own photo metadata"
  on public.gym_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

drop policy if exists "Users manage their own check-in photos" on storage.objects;
create policy "Users manage their own check-in photos"
  on storage.objects for all
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
