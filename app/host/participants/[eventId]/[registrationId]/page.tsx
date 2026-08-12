import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getHostRegistrationDetail,
  verifyHostOwnsEvent,
} from "@/lib/queries/host-participants";
import { HostParticipantDetail } from "@/components/host/HostParticipantDetail";

type PageProps = {
  params: Promise<{ eventId: string; registrationId: string }>;
};

export default async function HostParticipantDetailPage({ params }: PageProps) {
  const { eventId, registrationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/host/participants/${eventId}/${registrationId}`)}`,
    );
  }

  const isOwner = await verifyHostOwnsEvent(user.id, eventId);
  if (!isOwner) redirect("/host/gyms");

  const detail = await getHostRegistrationDetail(eventId, registrationId);
  if (!detail) notFound();

  const backParams = new URLSearchParams({
    event: eventId,
    gym: detail.gymId,
  });

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/host/participants?${backParams.toString()}`}
        className="text-sm text-orange-600 hover:underline"
      >
        ← 참가자 목록
      </Link>

      <div>
        <p className="text-sm text-zinc-500">{detail.eventTitle}</p>
        <p className="text-xs text-zinc-400">
          {new Date(detail.eventDate).toLocaleDateString("ko-KR")}
        </p>
      </div>

      <HostParticipantDetail participant={detail.participant} />
    </div>
  );
}
