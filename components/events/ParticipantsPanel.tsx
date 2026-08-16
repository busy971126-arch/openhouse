"use client";

import { useMemo, useState } from "react";
import type { RegistrationStatus } from "@/lib/types/database";
import { ALL_WEIGHT_CLASS_OPTIONS } from "@/lib/constants/profile";
import { RegistrationRow } from "@/app/events/[id]/participants/RegistrationRow";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import { organizeParticipantParties } from "@/lib/utils/participant-party";

type ParticipantsPanelProps = {
  registrations: ParticipantItem[];
  variant?: "dropdown" | "tabs";
};

type StatusTab = "all" | "approved" | "pending" | "cancelled";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "approved", label: "확정" },
  { value: "pending", label: "대기" },
  { value: "cancelled", label: "취소" },
];

function matchesStatusTab(status: RegistrationStatus, tab: StatusTab): boolean {
  if (tab === "all") return true;
  if (tab === "approved") return status === "approved";
  if (tab === "pending") return status === "pending";
  return status === "cancelled" || status === "rejected";
}

export function ParticipantsPanel({
  registrations,
  variant = "dropdown",
}: ParticipantsPanelProps) {
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");

  const weightOptions = useMemo(() => {
    const fromData = new Set(
      registrations
        .map((reg) => reg.weightClass?.trim())
        .filter((value): value is string => !!value),
    );
    return ["all", ...ALL_WEIGHT_CLASS_OPTIONS.map((o) => o.value).filter((v) => fromData.has(v))];
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return registrations.filter((reg) => {
      if (variant === "tabs") {
        if (!matchesStatusTab(reg.status, statusTab)) return false;
      } else if (statusFilter !== "all" && reg.status !== statusFilter) {
        return false;
      }

      if (weightFilter !== "all" && reg.weightClass !== weightFilter) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        reg.displayName,
        reg.nickname,
        reg.phone,
        reg.parentPhone,
        reg.weightClass,
        reg.gymAffiliation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    query,
    registrations,
    statusFilter,
    statusTab,
    variant,
    weightFilter,
  ]);

  const grouped = useMemo(
    () => organizeParticipantParties(filtered),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="예정 참가자 검색"
        className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm"
      />

      {variant === "tabs" ? (
        <div className="flex rounded-xl bg-zinc-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                statusTab === tab.value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="all">전체 상태</option>
          <option value="pending">대기</option>
          <option value="approved">확정</option>
          <option value="rejected">거절</option>
          <option value="cancelled">취소</option>
        </select>
      )}

      {variant === "tabs" && weightOptions.length > 1 && (
        <select
          value={weightFilter}
          onChange={(e) => setWeightFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="all">체급 전체</option>
          {weightOptions
            .filter((value) => value !== "all")
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
      )}

      {grouped.length === 0 ? (
        <p className="text-sm text-zinc-500">검색 결과가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {grouped.map((group) => (
            <RegistrationRow
              key={group.key}
              id={group.leader.id}
              userId={group.leader.userId}
              displayName={group.leader.displayName}
              nickname={group.leader.nickname}
              gender={group.leader.gender}
              ageGroup={group.leader.ageGroup}
              weightClass={group.leader.weightClass}
              experience={group.leader.experience}
              gymAffiliation={group.leader.gymAffiliation}
              applicantNotes={group.leader.applicantNotes}
              seekingSparring={group.leader.seekingSparring}
              phone={group.leader.phone}
              parentPhone={group.leader.parentPhone}
              regions={group.leader.regions}
              preferredSports={group.leader.preferredSports}
              status={group.leader.status}
              autoApproved={group.leader.autoApproved}
              operatorMemo={group.leader.operatorMemo}
              createdAt={group.leader.createdAt}
              partyGroup={group.companions.length > 0 ? group : undefined}
              isOwner
              showPhoneInSummary
            />
          ))}
        </ul>
      )}
    </div>
  );
}
