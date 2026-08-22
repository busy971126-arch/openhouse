import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminApplication } from "@/lib/queries/admin";
import {
  formatAdminDate,
  formatAdminDateTime,
  formatApplicationAdminStatus,
} from "@/lib/utils/admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminApplicationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const { supabase } = await getAdminViewer();
  const application = await getAdminApplication(supabase, id);
  if (!application) notFound();

  return (
    <div>
      <Link
        href="/admin/applications"
        className="text-xs font-semibold tracking-wide text-zinc-500 hover:text-zinc-950"
      >
        ← APPLICATIONS
      </Link>
      <p className="mt-6 text-[10px] font-black tracking-[0.18em] text-zinc-400">
        APPLICATION
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        {application.participantLabel}
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        {formatApplicationAdminStatus(application.status)} · {application.hostLabel}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {formatAdminDateTime(application.createdAt)}
      </p>

      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            EVENT
          </dt>
          <dd className="mt-1">
            <Link
              href={`/admin/events/${application.eventId}`}
              className="font-semibold text-zinc-950 underline underline-offset-4"
            >
              {application.eventTitle}
            </Link>
            <p className="mt-1 text-zinc-600">
              {formatAdminDate(application.eventDate)} · {application.gymName}
            </p>
          </dd>
        </div>
      </dl>

      {application.participantId && (
        <Link
          href={`/users/${application.participantId}`}
          className="mt-8 inline-block text-sm font-bold tracking-wide text-zinc-950 underline underline-offset-4"
        >
          PUBLIC PROFILE →
        </Link>
      )}
    </div>
  );
}
