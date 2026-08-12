"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { MyRegistrationCard } from "@/components/my/MyRegistrationCard";
import { EmptyState } from "@/components/EmptyState";
import {
  bucketScheduleByTab,
  countScheduleTabs,
  type MyScheduleTab,
} from "@/lib/utils/my-schedule";
import type { RegistrationStatus } from "@/lib/types/database";

export type MyRegistrationItem = {
  id: string;
  eventId: string;
  status: RegistrationStatus;
  title: string;
  eventDate: string;
  eventTime: string | null;
  eventType?: string;
  sport: string;
  region: string;
};

type MyRegistrationsListProps = {
  registrations: MyRegistrationItem[];
  initialTab?: MyScheduleTab;
};

const TAB_LABELS: Record<MyScheduleTab, string> = {
  today: "오늘",
  week: "이번주",
  past: "지난",
};

export function MyRegistrationsList({
  registrations,
  initialTab = "today",
}: MyRegistrationsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<MyScheduleTab>(initialTab);

  const buckets = useMemo(
    () => bucketScheduleByTab(registrations),
    [registrations],
  );
  const counts = useMemo(
    () => countScheduleTabs(registrations),
    [registrations],
  );

  const visible = buckets[tab];

  function selectTab(next: MyScheduleTab) {
    setTab(next);
    router.replace(`/my/registrations?tab=${next}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-xl bg-zinc-100 p-1">
        {(["today", "week", "past"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => selectTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {TAB_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col gap-3">
          <EmptyState
            message={
              tab === "today"
                ? "오늘 참가 일정이 없습니다."
                : tab === "week"
                  ? "이번주 참가 일정이 없습니다."
                  : "지난 참가 이력이 없습니다."
            }
          />
          {tab !== "past" && (
            <Link
              href="/events"
              className="text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              이벤트 찾기 →
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((reg) => (
            <MyRegistrationCard
              key={reg.id}
              registrationId={reg.id}
              eventId={reg.eventId}
              status={reg.status}
              title={reg.title}
              eventDate={reg.eventDate}
              eventTime={reg.eventTime}
              eventType={reg.eventType}
              sport={reg.sport}
              region={reg.region}
              emphasizeToday={tab === "today"}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
