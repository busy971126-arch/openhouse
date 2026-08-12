"use client";

import { useMemo, useState } from "react";
import type { RegistrationStatus } from "@/lib/types/database";
import { ALL_WEIGHT_CLASS_OPTIONS } from "@/lib/constants/profile";
import { RegistrationRow } from "@/app/events/[id]/participants/RegistrationRow";
import type { ParticipantItem } from "@/lib/utils/participant-items";

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

const SPARRING_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "대련 전체" },
  { value: "yes", label: "대련 찾기만" },
  { value: "no", label: "대련 없음" },
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
  const [sparringFilter, setSparringFilter] = useState("all");

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

      if (sparringFilter === "yes" && !reg.seekingSparring) {
        return false;
      }

      if (sparringFilter === "no" && reg.seekingSparring) {
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
    sparringFilter,
    statusFilter,
    statusTab,
    variant,
    weightFilter,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="참가자 검색"
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

      {variant === "tabs" && (
        <div className="grid grid-cols-2 gap-2">
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
          <select
            value={sparringFilter}
            onChange={(e) => setSparringFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {SPARRING_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">검색 결과가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((reg) => (
            <RegistrationRow
              key={reg.id}
              id={reg.id}
              userId={reg.userId}
              displayName={reg.displayName}
              nickname={reg.nickname}
              gender={reg.gender}
              ageGroup={reg.ageGroup}
              weightClass={reg.weightClass}
              experience={reg.experience}
              gymAffiliation={reg.gymAffiliation}
              applicantNotes={reg.applicantNotes}
              seekingSparring={reg.seekingSparring}
              phone={reg.phone}
              parentPhone={reg.parentPhone}
              regions={reg.regions}
              preferredSports={reg.preferredSports}
              status={reg.status}
              operatorMemo={reg.operatorMemo}
              createdAt={reg.createdAt}
              isOwner
              showPhoneInSummary
            />
          ))}
        </ul>
      )}
    </div>
  );
}
