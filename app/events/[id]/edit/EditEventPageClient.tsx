"use client";

import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { Alert } from "@/components/Alert";
import type { Event, Gym } from "@/lib/types/database";

type EditEventPageClientProps = {
  event: Event;
  gyms: Gym[];
};

export function EditEventPageClient({ event, gyms }: EditEventPageClientProps) {
  if (gyms.length === 0) {
    return (
      <div>
        <Alert message="체육관 정보를 찾을 수 없습니다." />
        <Link href="/my/profile" className="mt-4 inline-block text-orange-600">
          ← 내 프로필
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <Link
        href={`/events/${event.id}`}
        className="text-sm text-orange-600 hover:underline"
      >
        ← {event.title}
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold">일정 수정</h1>
      <EventForm
        gyms={gyms}
        mode="edit"
        event={event}
        redirectTo={`/events/${event.id}`}
      />
    </div>
  );
}
