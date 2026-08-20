"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type {
  HostEventOption,
  HostGymOption,
} from "@/lib/queries/host-participants";
import {
  countActiveHostParticipants,
  countHostParticipantsByTab,
  HOST_PARTICIPANT_TABS,
  matchesHostParticipantTab,
  type HostParticipantTab,
} from "@/lib/utils/host-participant-status";
import {
  buildRegistrationStatusMap,
  filterRegistrationIdsByStatus,
} from "@/lib/utils/host-participant-selection";
import { buildPartyCompanionLabelsByRegistrationId } from "@/lib/utils/host-participant-party-labels";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { HostParticipantRow } from "@/components/host/HostParticipantRow";
import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantsManagerProps = {
  gyms: HostGymOption[];
  events: HostEventOption[];
  eventsError?: boolean;
  registrations: ParticipantItem[];
  registrationsError?: boolean;
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

function matchesNameQuery(participant: ParticipantItem, query: string): boolean {
  if (!query) return true;

  const haystack = [participant.displayName, participant.nickname]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function HostParticipantsManager({
  gyms,
  events,
  eventsError = false,
  registrations,
  registrationsError = false,
  selectedGymId,
  selectedEventId,
  selectedEvent,
}: HostParticipantsManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HostParticipantTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  function navigate(gymId: string, eventId: string | null) {
    const params = new URLSearchParams();
    params.set("gym", gymId);
    if (eventId) params.set("event", eventId);
    router.push(`/host/participants?${params.toString()}`);
  }

  const tabCounts = useMemo(
    () => countHostParticipantsByTab(registrations),
    [registrations],
  );

  const activeCount = useMemo(
    () => countActiveHostParticipants(registrations),
    [registrations],
  );

  const partyCompanionLabelsByRegistrationId = useMemo(
    () => buildPartyCompanionLabelsByRegistrationId(registrations),
    [registrations],
  );

  const statusById = useMemo(
    () => buildRegistrationStatusMap(registrations),
    [registrations],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return registrations
      .filter((registration) =>
        matchesHostParticipantTab(registration.status, activeTab),
      )
      .filter((registration) =>
        matchesNameQuery(registration, normalizedQuery),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [activeTab, query, registrations]);

  const visibleRegistrationIds = useMemo(
    () => filtered.map((registration) => registration.id),
    [filtered],
  );

  const allVisibleSelected =
    visibleRegistrationIds.length > 0 &&
    visibleRegistrationIds.every((id) => selectedIds.has(id));

  const selectedPendingIds = useMemo(
    () => filterRegistrationIdsByStatus([...selectedIds], statusById, ["pending"]),
    [selectedIds, statusById],
  );

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, query, selectedEventId]);

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(visibleRegistrationIds));
  }

  async function bulkUpdateStatus(
    ids: string[],
    status: RegistrationStatus,
    confirmMessage?: string,
  ) {
    if (ids.length === 0) return;
    if (confirmMessage && !confirm(confirmMessage)) return;

    setBulkLoading(true);
    setBulkError(null);

    const supabase = createClient();
    let failed = 0;

    for (const id of ids) {
      const { error } = await supabase.rpc("update_registration_status", {
        p_registration_id: id,
        p_status: status,
      });
      if (error) failed += 1;
    }

    setBulkLoading(false);

    if (failed > 0) {
      setBulkError(
        failed === ids.length
          ? "일괄 처리에 실패했습니다."
          : `${ids.length - failed}명 처리 · ${failed}명 실패`,
      );
      router.refresh();
      return;
    }

    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <div className={`flex flex-col gap-5 ${selectedIds.size > 0 ? "pb-28" : ""}`}>
      <Link
        href={`/host/gyms/${selectedGymId}`}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 체육관 관리
      </Link>

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
            disabled={eventsError || events.length === 0}
          >
            {eventsError ? (
              <option value="">일정을 불러오지 못했습니다</option>
            ) : events.length === 0 ? (
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
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold text-zinc-900">참가자 관리</h1>
              <span className="text-sm font-medium text-zinc-900">
                {activeCount}명
              </span>
              {registrations.length !== activeCount && (
                <span className="text-xs text-zinc-500">
                  (전체 {registrations.length}명)
                </span>
              )}
            </div>
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 닉네임 검색"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-5 gap-1 rounded-lg bg-zinc-100 p-1">
            {HOST_PARTICIPANT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-md px-0.5 py-2 text-[11px] font-medium transition sm:px-1 sm:text-xs ${
                  activeTab === tab.value
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
                <span className="ml-0.5 text-[10px] text-zinc-400">
                  {tabCounts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="size-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                전체 선택
              </label>
              {selectedIds.size > 0 && (
                <span className="text-sm font-medium text-orange-700">
                  {selectedIds.size}명 선택
                </span>
              )}
            </div>
          )}

          {bulkError && <Alert message={bulkError} />}

          {registrationsError ? (
            <Alert message="참가자 정보를 불러오지 못했습니다." />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                registrations.length === 0
                  ? "아직 참가 신청이 없습니다."
                  : query.trim()
                    ? "검색 결과가 없습니다."
                    : "표시할 참가자가 없습니다."
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((participant) => (
                <HostParticipantRow
                  key={participant.id}
                  eventId={selectedEvent.id}
                  participant={participant}
                  selected={selectedIds.has(participant.id)}
                  partyCompanionLabels={
                    partyCompanionLabelsByRegistrationId.get(participant.id) ??
                    []
                  }
                  onSelectedChange={(selected) => {
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (selected) next.add(participant.id);
                      else next.delete(participant.id);
                      return next;
                    });
                  }}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {eventsError ? (
        <Alert message="일정을 불러오지 못했습니다." />
      ) : !selectedEvent && events.length === 0 ? (
        <EmptyState message="등록된 일정이 없습니다." />
      ) : null}

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-lg px-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
            <p className="text-sm font-medium text-zinc-900">
              {selectedIds.size}명 선택됨
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={bulkLoading || selectedPendingIds.length === 0}
                onClick={() =>
                  bulkUpdateStatus(
                    selectedPendingIds,
                    "rejected",
                    "선택한 참가 신청을 거절하시겠습니까?",
                  )
                }
                className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                거절
              </button>
              <button
                type="button"
                disabled={bulkLoading || selectedPendingIds.length === 0}
                onClick={() => bulkUpdateStatus(selectedPendingIds, "approved")}
                className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                참가 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
