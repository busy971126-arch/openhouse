"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GymListCard } from "@/components/gym/GymListCard";
import { InterestHeart } from "@/components/interest/InterestHeart";
import { formatInterestEventStatusLine } from "@/lib/utils/interest-display";
import type { EventRecruitmentStatus } from "@/lib/utils/event-status";
import type { GymWithEventCount } from "@/lib/queries/gyms";

type EventInterestRow = {
  event_id: string;
  event: {
    id: string;
    title: string;
    sport: string;
    region: string;
    event_date: string;
    event_type: string;
  };
  recruitmentStatus: EventRecruitmentStatus;
};

type MyInterestsTabsProps = {
  userId: string;
  gymItems: GymWithEventCount[];
  eventItems: EventInterestRow[];
};

export function MyInterestsTabs({
  userId,
  gymItems,
  eventItems,
}: MyInterestsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "gyms" ? "gyms" : "events";

  function setTab(next: "events" | "gyms") {
    router.replace(`/my/interests?tab=${next}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex rounded-xl border border-zinc-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setTab("events")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
            tab === "events"
              ? "bg-orange-600 text-white"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          ❤️ 관심 이벤트
        </button>
        <button
          type="button"
          onClick={() => setTab("gyms")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
            tab === "gyms"
              ? "bg-orange-600 text-white"
              : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          ❤️ 관심 체육관
        </button>
      </div>

      {tab === "events" ? (
        eventItems.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            관심 등록한 이벤트가 없습니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {eventItems.map((item) => (
              <li
                key={item.event_id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/events/${item.event.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900">{item.event.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatInterestEventStatusLine(
                        item.event.event_date,
                        item.event.event_type,
                        item.recruitmentStatus,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {item.event.sport} · {item.event.region}
                    </p>
                  </Link>
                  <InterestHeart
                    kind="event"
                    targetId={item.event.id}
                    initialInterested
                    userId={userId}
                    loginRedirect={`/my/interests?tab=events`}
                    size="xs"
                  />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : gymItems.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          관심 등록한 체육관이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {gymItems.map((gym) => (
            <GymListCard
              key={gym.id}
              gym={gym}
              userId={userId}
              initialInterested
            />
          ))}
        </div>
      )}
    </div>
  );
}
