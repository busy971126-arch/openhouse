import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminEventDetail } from "@/lib/queries/admin";
import {
  formatAdminDate,
  formatAdminDateTime,
  formatEventAdminStatus,
} from "@/lib/utils/admin";
import { formatEventType } from "@/lib/constants/event-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await getAdminViewer();
  const event = await getAdminEventDetail(supabase, id);
  if (!event) notFound();

  return (
    <div>
      <Link
        href="/admin/events"
        className="text-xs font-semibold tracking-wide text-zinc-500 hover:text-zinc-950"
      >
        ← EVENTS
      </Link>
      <p className="mt-6 text-[10px] font-black tracking-[0.18em] text-zinc-400">
        EVENT
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        {event.title}
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        {event.gymName} · {event.hostLabel}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {formatEventAdminStatus(event.status)} ·{" "}
        {event.gymIsPublic ? "공개 체육관" : "비공개 체육관"} ·{" "}
        {formatAdminDateTime(event.createdAt)}
      </p>

      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            TYPE
          </dt>
          <dd className="mt-1 text-zinc-800">
            {formatEventType(event.eventType)} · {event.sport}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            WHEN
          </dt>
          <dd className="mt-1 text-zinc-800">
            {formatAdminDate(event.eventDate)}
            {event.eventTime ? ` · ${event.eventTime.slice(0, 5)}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            WHERE
          </dt>
          <dd className="mt-1 text-zinc-800">
            {event.region}
            {event.address ? ` · ${event.address}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            APPLICATIONS
          </dt>
          <dd className="mt-1 text-zinc-800">
            {event.activeApplicationCount}
            {event.maxParticipants != null ? ` / ${event.maxParticipants}` : ""}
          </dd>
        </div>
      </dl>

      {event.description && (
        <div className="mt-8 border-t border-zinc-200 pt-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            DESCRIPTION
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-800">
            {event.description}
          </p>
        </div>
      )}

      {event.isPubliclyViewable && (
        <Link
          href={`/events/${event.id}`}
          className="mt-8 inline-block text-sm font-bold tracking-wide text-zinc-950 underline underline-offset-4"
        >
          PUBLIC VIEW →
        </Link>
      )}
    </div>
  );
}
