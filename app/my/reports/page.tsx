import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserReports } from "@/lib/queries/event-interests";
import { ReportSection } from "@/components/support/ReportSection";

type PageProps = {
  searchParams: Promise<{
    eventId?: string;
    reportedUserId?: string;
  }>;
};

export default async function MyReportsPage({ searchParams }: PageProps) {
  const { eventId, reportedUserId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/reports");

  const { data: reports } = await getUserReports(user.id);

  let eventTitle: string | null = null;
  let reportedUserLabel: string | null = null;

  if (eventId) {
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", eventId)
      .maybeSingle();
    eventTitle = event?.title ?? null;
  }

  if (reportedUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, display_name")
      .eq("id", reportedUserId)
      .maybeSingle();
    reportedUserLabel =
      profile?.nickname?.trim() || profile?.display_name?.trim() || null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={eventId ? `/events/${eventId}` : "/my"}
        className="text-sm font-medium text-orange-600"
      >
        ← {eventId ? "이벤트로 돌아가기" : "마이페이지"}
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">신고하기</h1>
      <p className="text-sm text-zinc-600">
        노쇼, 폭언, 허위정보 등 문제를 운영팀에 알려주세요.
      </p>

      <ReportSection
        userId={user.id}
        initialReports={reports ?? []}
        defaultEventId={eventId ?? null}
        defaultReportedUserId={reportedUserId ?? null}
        eventTitle={eventTitle}
        reportedUserLabel={reportedUserLabel}
      />
    </div>
  );
}
