import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRegistrations } from "@/lib/queries/events";
import { MyRegistrationsList } from "@/components/my/MyRegistrationsList";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import type { RegistrationStatus } from "@/lib/types/database";

type PageProps = {
  searchParams: Promise<{
    applied?: string;
    date?: string;
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
  const showAppliedBanner = params.applied === "1";
  const initialSelectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date
    : undefined;

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
            신청한 운동 일정을 캘린더와 목록에서 확인하세요.
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
          cancelledByEvent: Boolean(reg.cancelled_by_event),
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
          신청한 모든 예정 일정을 캘린더와 목록에서 확인하세요.
        </p>
      </div>

      {showAppliedBanner && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ 신청이 완료되어 내 일정에 추가되었습니다. 아래 캘린더에서 바로 확인할 수 있어요.
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
        <MyRegistrationsList
          registrations={items}
          initialSelectedDate={initialSelectedDate}
        />
      )}
    </div>
  );
}
