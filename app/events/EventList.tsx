import { EventListCard } from "@/components/events/EventListCard";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import {
  matchesRecruitmentFilter,
  type EventRecruitmentFilter,
} from "@/lib/constants/event-recruitment-filter";
import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { getEvents } from "@/lib/queries/events";
import type { EventType } from "@/lib/types/database";
import { getEventRecruitmentStatus } from "@/lib/utils/event-status";

type EventListProps = {
  region?: string;
  sport?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: EventType;
  includePast?: boolean;
  nearbyRegions?: string[];
  searchQuery?: string;
  recruitmentStatus?: EventRecruitmentFilter;
};

export async function EventList({
  region,
  sport,
  date,
  dateFrom,
  dateTo,
  eventType,
  includePast,
  nearbyRegions,
  searchQuery,
  recruitmentStatus = "recruiting",
}: EventListProps) {
  const { data, error } = await getEvents({
    region,
    sport,
    date,
    dateFrom,
    dateTo,
    eventType,
    includePast,
    nearbyRegions,
    searchQuery,
  });

  if (error) {
    return (
      <Alert message="이벤트를 불러오지 못했습니다. Supabase 설정을 확인해주세요." />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState message="조건에 맞는 이벤트가 없습니다. 필터를 바꿔보세요." />
    );
  }

  const countsMap = await getApprovedCountsByEvent(data.map((event) => event.id));

  const visible = data.filter((event) => {
    const approved = countsMap.get(event.id) ?? 0;
    const status = getEventRecruitmentStatus({
      eventDate: event.event_date,
      maxParticipants: event.max_participants,
      approvedCount: approved,
      recruitmentClosed: event.recruitment_closed ?? false,
      registrationDeadline: event.registration_deadline,
    });

    if (!includePast && !matchesRecruitmentFilter(status, recruitmentStatus)) {
      return false;
    }

    if (
      !includePast &&
      recruitmentStatus === "recruiting" &&
      event.max_participants != null &&
      event.max_participants > 0 &&
      approved >= event.max_participants
    ) {
      return false;
    }

    return true;
  });

  if (visible.length === 0) {
    return <EmptyState message="모집 중인 이벤트가 없습니다." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.map((event) => (
        <EventListCard
          key={event.id}
          event={event}
          approvedCount={countsMap.get(event.id) ?? 0}
        />
      ))}
    </div>
  );
}
