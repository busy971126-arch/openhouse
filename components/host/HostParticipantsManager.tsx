"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type {
  HostEventOption,
  HostGymOption,
} from "@/lib/queries/host-participants";
import {
  HOST_PARTICIPANT_TABS,
  matchesHostParticipantTab,
  type HostParticipantTab,
} from "@/lib/utils/host-participant-status";
import { EmptyState } from "@/components/EmptyState";
import { HostParticipantListItem } from "@/components/host/HostParticipantListItem";

type HostParticipantsManagerProps = {
  gyms: HostGymOption[];
  events: HostEventOption[];
  registrations: ParticipantItem[];
  selectedGymId: string;
  selectedEventId: string | null;
  selectedEvent: HostEventOption | null;
};

function formatEventLabel(event: HostEventOption): string {
  const date = new Date(event.eventDate).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
  const activeCount = event.counts.approved + event.counts.pending;
  return `${date} · ${event.title} (${activeCount}명)`;
}

export function HostParticipantsManager({
  gyms,
  events,
  registrations,
  selectedGymId,
  selectedEventId,
  selectedEvent,
}: HostParticipantsManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HostParticipantTab>("all");

  function navigate(gymId: string, eventId: string | null) {
    const params = new URLSearchParams();
    params.set("gym", gymId);
    if (eventId) params.set("event", eventId);
    router.push(`/host/participants?${params.toString()}`);
  }

  const stats = useMemo(() => {
    if (!selectedEvent) {
      return { approved: 0, pending: 0, cancelled: 0, max: null as number | null };
    }

    return {
      approved: selectedEvent.counts.approved,
      pending: selectedEvent.counts.pending,
      cancelled: selectedEvent.counts.cancelled + selectedEvent.counts.rejected,
      max: selectedEvent.maxParticipants,
    };
  }, [selectedEvent]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return registrations.filter((reg) => {
      if (!matchesHostParticipantTab(reg.status, activeTab)) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        reg.displayName,
        reg.nickname,
        reg.phone,
        reg.parentPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [activeTab, query, registrations]);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/host/gyms/${selectedGymId}`}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 체육관 관리
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">참가자 관리</h1>
        <p className="mt-1 text-sm text-zinc-600">
          체육관과 일정을 선택해 참가자를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {gyms.length > 1 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">체육관</span>
            <select
              value={selectedGymId}
              onChange={(e) => navigate(e.target.value, null)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">일정</span>
          <select
            value={selectedEventId ?? ""}
            onChange={(e) => navigate(selectedGymId, e.target.value || null)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            disabled={events.length === 0}
          >
            {events.length === 0 ? (
              <option value="">등록된 일정이 없습니다</option>
            ) : (
              events.map((event) => (
                <option key={event.id} value={event.id}>
                  {formatEventLabel(event)}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {selectedEvent && (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">
              {stats.max != null
                ? `${stats.approved} / ${stats.max}명`
                : `${stats.approved}명 확정`}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              확정 {stats.approved} · 대기 {stats.pending} · 취소 {stats.cancelled}
            </p>
          </div>

          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
            {HOST_PARTICIPANT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  activeTab === tab.value
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 닉네임, 연락처 검색"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />

          {filtered.length === 0 ? (
            <EmptyState
              message={
                registrations.length === 0
                  ? "아직 참가 신청이 없습니다."
                  : "검색 결과가 없습니다."
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((participant) => (
                <HostParticipantListItem
                  key={participant.id}
                  eventId={selectedEvent.id}
                  participant={participant}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {!selectedEvent && events.length === 0 && (
        <EmptyState message="이 체육관에 등록된 일정이 없습니다." />
      )}
    </div>
  );
}
