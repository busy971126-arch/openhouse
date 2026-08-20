import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRegistrations } from "@/lib/queries/events";
import { MyRegistrationsList } from "@/components/my/MyRegistrationsList";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { parseMyScheduleTab } from "@/lib/utils/my-schedule";
import type { RegistrationStatus } from "@/lib/types/database";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    applied?: string;
  }>;
};

export default async function MyRegistrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/registrations");

  const { data: registrations, error: registrationsError } =
    await getUserRegistrations(user.id);
  const initialTab = parseMyScheduleTab(params.tab);
  const showAppliedBanner = params.applied === "1";

  if (registrationsError) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          ← 홈
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">내 일정</h1>
          <p className="mt-1 text-sm text-zinc-600">
            오늘·이번주 운동 일정과 신청 상태를 확인하세요.
          </p>
        </div>
        <Alert message="참가 신청 내역을 불러오지 못했습니다." />
      </div>
    );
  }

  const items =
    registrations
      ?.map((reg) => {
        const event = reg.events as {
          title: string;
          event_date: string;
          event_time: string | null;
          event_type: string;
          sport: string;
          region: string;
        } | null;

        if (!event) return null;

        return {
          id: reg.id,
          eventId: reg.event_id,
          status: reg.status as RegistrationStatus,
          title: event.title,
          eventDate: event.event_date,
          eventTime: event.event_time,
          eventType: event.event_type,
          sport: event.sport,
          region: event.region,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 홈
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">내 일정</h1>
        <p className="mt-1 text-sm text-zinc-600">
          오늘·이번주 운동 일정과 신청 상태를 확인하세요.
        </p>
      </div>

      {showAppliedBanner && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ 신청이 완료되어 내 일정에 추가되었습니다. 호스트 승인을 기다려주세요.
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col gap-3">
          <EmptyState message="참가 신청 이력이 없습니다." />
          <Link
            href="/events"
            className="text-center text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            이벤트 찾기 →
          </Link>
        </div>
      ) : (
        <MyRegistrationsList registrations={items} initialTab={initialTab} />
      )}
    </div>
  );
}
