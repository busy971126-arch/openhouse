-- Keep friend request state transitions usable while preventing requesters from
-- accepting their own requests. Only status + updated_at are client-updatable.

drop policy if exists "Receivers can respond to friend requests" on public.friendships;
drop policy if exists "Requesters can resend rejected friend requests" on public.friendships;

create policy "Receivers can respond to friend requests"
on public.friendships
for update
to authenticated
using (
  auth.uid() = addressee_id
  and status = 'pending'
)
with check (
  auth.uid() = addressee_id
  and status in ('accepted', 'rejected')
);

create policy "Requesters can resend rejected friend requests"
on public.friendships
for update
to authenticated
using (
  auth.uid() = requester_id
  and status = 'rejected'
)
with check (
  auth.uid() = requester_id
  and status = 'pending'
);

revoke update on public.friendships from authenticated;
grant update (status, updated_at) on public.friendships to authenticated;
