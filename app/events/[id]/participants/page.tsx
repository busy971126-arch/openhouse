import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getRegistrationsForEvent } from "@/lib/queries/events";
import { getEventParticipantPreview } from "@/lib/queries/participant-preview";
import { EmptyState } from "@/components/EmptyState";
import { EventParticipantPreview } from "@/components/events/EventParticipantPreview";
import { HostParticipantStats } from "@/components/events/HostParticipantStats";
import { ParticipantsPanel } from "@/components/events/ParticipantsPanel";
import {
  countParticipantStats,
  mapRegistrationToParticipantItem,
} from "@/lib/utils/participant-items";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParticipantsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event, error } = await getEvent(id);
  if (error || !event) notFound();

  const gym = event.gyms as { name: string; owner_id: string } | null;
  if (!gym || gym.owner_id !== user.id) {
    redirect(`/events/${id}`);
  }

  const [{ data: registrations }, { data: preview }] = await Promise.all([
    getRegistrationsForEvent(id),
    getEventParticipantPreview(id),
  ]);

  const items = (registrations ?? []).map(mapRegistrationToParticipantItem);
  const stats = countParticipantStats(items);
  const sparring = items.filter((item) => item.seekingSparring).length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/host/participants?gym=${event.gym_id}&event=${id}`}
        className="text-sm text-orange-600 hover:underline"
      >
        ← 참가자 관리
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">참가자 관리</p>
      </div>

      <HostParticipantStats
        approved={stats.approved}
        pending={stats.pending}
        cancelled={stats.cancelled}
        maxParticipants={event.max_participants}
      />

      <EventParticipantPreview preview={preview} />

      {items.length === 0 ? (
        <EmptyState message="아직 참가 신청이 없습니다." />
      ) : (
        <ParticipantsPanel registrations={items} variant="tabs" />
      )}

      {sparring > 0 && (
        <p className="text-xs text-zinc-500">
          대련 찾기 참가자 {sparring}명
        </p>
      )}
    </div>
  );
}
