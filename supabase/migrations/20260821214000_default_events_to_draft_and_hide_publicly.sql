alter table public.events
  alter column status set default 'draft'::text;

drop policy if exists "Events are viewable by everyone" on public.events;

create policy "Published events are viewable; creators can view drafts"
on public.events
for select
using (status <> 'draft' or created_by = auth.uid());
