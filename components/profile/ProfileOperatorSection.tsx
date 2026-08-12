import Link from "next/link";
import { DashboardEventCard } from "@/components/dashboard/DashboardEventCard";
import type { DashboardEvent } from "@/lib/queries/dashboard";

type ProfileOperatorSectionProps = {
  pendingApprovals: number;
  operatingEvents: DashboardEvent[];
};

export function ProfileOperatorSection({
  pendingApprovals,
  operatingEvents,
}: ProfileOperatorSectionProps) {
  const firstPendingEvent = operatingEvents.find(
    (event) => event.counts.pending > 0,
  );

  if (pendingApprovals === 0 && operatingEvents.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {pendingApprovals > 0 && (
        <Link
          href={
            firstPendingEvent
              ? `/host/participants?gym=${firstPendingEvent.gym_id}&event=${firstPendingEvent.id}`
              : "/host/gyms"
          }
          className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800 hover:bg-orange-100"
        >
          승인 대기 {pendingApprovals}명 — 참가자 관리하기
        </Link>
      )}

      {operatingEvents.length > 0 && (
        <ul className="flex flex-col gap-3">
          {operatingEvents.map((event) => (
            <DashboardEventCard key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
