"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { GymSummaryCard } from "@/components/gym/GymSummaryCard";
import type { Event, EventDifficulty, Gym } from "@/lib/types/database";
import { EVENT_TYPE_OPTIONS } from "@/lib/constants/event-types";
import { EVENT_DIFFICULTY_OPTIONS } from "@/lib/constants/event-meta";
import type { EventType } from "@/lib/types/database";

type EventFormProps = {
  gyms: Gym[];
  mode: "create" | "edit";
  event?: Event;
  redirectTo?: string;
  defaultGymId?: string;
};

export function EventForm({
  gyms,
  mode,
  event,
  redirectTo = "/my/profile",
  defaultGymId,
}: EventFormProps) {
  const router = useRouter();
  const initialGymId =
    event?.gym_id ??
    (defaultGymId && gyms.some((g) => g.id === defaultGymId)
      ? defaultGymId
      : gyms[0]?.id ?? "");
  const [gymId, setGymId] = useState(initialGymId);
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(
    event?.event_type ?? "open_mat",
  );
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
  const [eventTime, setEventTime] = useState(
    event?.event_time?.slice(0, 5) ?? "",
  );
  const [maxParticipants, setMaxParticipants] = useState(
    event?.max_participants?.toString() ?? "",
  );
  const [feeAmount, setFeeAmount] = useState(
    event?.fee_amount != null && event.fee_amount > 0
      ? String(event.fee_amount)
      : "",
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    event?.registration_deadline ?? "",
  );
  const [difficulty, setDifficulty] = useState<EventDifficulty | "">(
    event?.difficulty ?? "",
  );
  const [safetyRules, setSafetyRules] = useState(event?.safety_rules ?? "");
  const [prohibitedTechniques, setProhibitedTechniques] = useState(
    event?.prohibited_techniques ?? "",
  );
  const [requirements, setRequirements] = useState(event?.requirements ?? "");
  const [giRental, setGiRental] = useState(event?.gi_rental ?? "");
  const [visitDetails, setVisitDetails] = useState(event?.visit_details ?? "");
  const [safetyNotes, setSafetyNotes] = useState(event?.safety_notes ?? "");
  const [emergencyContact, setEmergencyContact] = useState(
    event?.emergency_contact ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedGym = useMemo(
    () => gyms.find((g) => g.id === gymId) ?? gyms[0],
    [gymId, gyms],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    if (!gymId || !selectedGym) {
      setError("체육관을 선택해주세요.");
      setLoading(false);
      return;
    }

    if (!selectedGym.address?.trim()) {
      setError("체육관 주소가 없습니다. 체육관 정보에서 주소를 먼저 등록해주세요.");
      setLoading(false);
      return;
    }

    const parsedFee = feeAmount.trim()
      ? parseInt(feeAmount.replace(/,/g, ""), 10)
      : null;

    if (parsedFee != null && (Number.isNaN(parsedFee) || parsedFee < 0)) {
      setError("참가비를 올바르게 입력해주세요.");
      setLoading(false);
      return;
    }

    const payload = {
      gym_id: gymId,
      title: title.trim(),
      event_type: eventType,
      description: description.trim() || null,
      sport: (selectedGym.sport ?? "유도").trim(),
      region: selectedGym.region.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      fee_amount: parsedFee && parsedFee > 0 ? parsedFee : null,
      registration_deadline: registrationDeadline || null,
      difficulty: difficulty || null,
      safety_rules: safetyRules.trim() || null,
      prohibited_techniques: prohibitedTechniques.trim() || null,
      requirements: requirements.trim() || null,
      gi_rental: giRental.trim() || null,
      visit_details: visitDetails.trim() || null,
      safety_notes: safetyNotes.trim() || null,
      emergency_contact: emergencyContact.trim() || null,
    };

    if (mode === "create") {
      const { error: insertError } = await supabase.from("events").insert({
        ...payload,
        created_by: user.id,
      });

      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    } else if (event) {
      const { error: updateError } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id);

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert message={error} />}

      <label className="flex flex-col gap-1 text-sm">
        체육관
        <select
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        >
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      {selectedGym && <GymSummaryCard gym={selectedGym} compact />}

      <p className="text-xs font-medium text-zinc-500">이번 일정 정보</p>

      <label className="flex flex-col gap-1 text-sm">
        유형
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        제목
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        날짜
        <input
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        시간 (선택)
        <input
          type="time"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        참가 인원 제한 (선택)
        <input
          type="number"
          min={1}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          placeholder="비워두면 제한 없음"
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        참가비 (원, 선택)
        <input
          type="number"
          min={0}
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          placeholder="비워두면 무료"
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        신청 마감일 (선택)
        <input
          type="date"
          value={registrationDeadline}
          onChange={(e) => setRegistrationDeadline(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        난이도 (선택)
        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as EventDifficulty | "")
          }
          className="rounded-lg border border-zinc-300 px-3 py-2"
        >
          <option value="">선택 안 함</option>
          {EVENT_DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        설명 (선택)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px] rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">참가 안내 (선택)</p>
        <p className="mt-1 text-xs text-zinc-500">
          이번 일정 참가자에게 필요한 도복·출입 정보를 입력하세요.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            도복 대여
            <input
              value={giRental}
              onChange={(e) => setGiRental(e.target.value)}
              placeholder="예: 1회 5,000원"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            출입 안내
            <textarea
              value={visitDetails}
              onChange={(e) => setVisitDetails(e.target.value)}
              placeholder="예: 3층, 정문 옆 엘리베이터"
              className="min-h-[60px] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">안전 정보 (선택)</p>
        <p className="mt-1 text-xs text-zinc-500">
          참가자가 미리 확인할 수 있는 대련 규칙과 안전 안내를 입력하세요.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            대련 규칙
            <textarea
              value={safetyRules}
              onChange={(e) => setSafetyRules(e.target.value)}
              placeholder="예: 입장 시 인사, 기술 시 상호 확인"
              className="min-h-[60px] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            금지 기술
            <textarea
              value={prohibitedTechniques}
              onChange={(e) => setProhibitedTechniques(e.target.value)}
              placeholder="예: 목 조르기, 무릎 관절기"
              className="min-h-[60px] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            참가 조건
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="예: 도복 착용, 초보자 환영"
              className="min-h-[60px] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            안전 수칙
            <textarea
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="예: 부상 시 즉시 멈추고 손목 터치"
              className="min-h-[60px] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            응급 연락
            <input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="예: 관장님 010-1234-5678"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading
          ? mode === "create"
            ? "등록 중..."
            : "저장 중..."
          : mode === "create"
            ? "이벤트 등록"
            : "저장"}
      </button>
    </form>
  );
}
