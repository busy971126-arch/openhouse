import Link from "next/link";
import type { DashboardEvent } from "@/lib/queries/dashboard";
import {
  formatEventDetailDate,
  formatEventTimeDisplay,
} from "@/lib/utils/date";
import { EVENT_STATUS_LABELS } from "@/lib/utils/event-status";
import { buildHostParticipantsUrl } from "@/lib/utils/host-participants-url";
import { EventManageActions } from "@/components/events/EventManageActions";

type DashboardEventCardProps = {
  event: DashboardEvent;
};

export function DashboardEventCard({ event }: DashboardEventCardProps) {
  const status = EVENT_STATUS_LABELS[event.recruitmentStatus];
  const participantLabel =
    event.max_participants != null
      ? `${event.counts.total}/${event.max_participants}명`
      : `${event.counts.total}명`;
  const timeLabel = formatEventTimeDisplay(event.event_time);

  const overWaitlist =
    event.max_participants != null &&
    event.counts.total > event.max_participants;

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-zinc-900">
              {event.title}
            </p>
            <p className="mt-1.5 text-sm text-zinc-500">
              {formatEventDetailDate(event.event_date)}
              {timeLabel ? ` · ${timeLabel}` : ""} · {participantLabel}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className} bg-zinc-50`}
            >
              {status.emoji} {status.label}
            </span>
            {event.counts.pending > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                대기 {event.counts.pending}
              </span>
            )}
          </div>
        </div>

        {overWaitlist && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            정원({event.max_participants}명)을 초과한 신청이 있습니다. 참가자
            관리에서 확인하세요.
          </p>
        )}
      </div>

      <div className="border-t border-zinc-100 px-4 pb-4 pt-4">
        <Link
          href={buildHostParticipantsUrl(event.gym_id, event.id)}
          className="block rounded-lg bg-orange-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-700"
        >
          참가자 관리
        </Link>
        <div className="mt-4 border-t border-zinc-100 pt-3">
          <EventManageActions event={event} variant="inline" />
        </div>
      </div>
    </li>
  );
}
