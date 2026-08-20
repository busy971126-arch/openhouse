-- Gym profile fields for operator management

alter table public.gyms
  add column if not exists photo_url text,
  add column if not exists description text,
  add column if not exists sns_url text,
  add column if not exists operating_hours text,
  add column if not exists is_public boolean not null default true;

-- Gym photo storage (run once; ignore if bucket already exists)
insert into storage.buckets (id, name, public)
values ('gym-photos', 'gym-photos', true)
on conflict (id) do nothing;

create policy "Gym photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'gym-photos');

create policy "Gym owners can upload gym photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gym-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Gym owners can update gym photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'gym-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Gym owners can delete gym photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gym-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
