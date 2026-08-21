"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { EventLocationFields } from "@/components/events/EventLocationFields";
import { EVENT_TYPE_OPTIONS } from "@/lib/constants/event-types";
import { createClient } from "@/lib/supabase/client";
import type { Gym } from "@/lib/types/database";
import type { EventType } from "@/lib/types/database";
import {
  createEmptyGymAddress,
  type GymAddressValue,
} from "@/lib/utils/address-region";
import {
  eventLocationToPayload,
  getEventLocationDefaults,
  validateEventLocation,
} from "@/lib/utils/event-location";

type LocationMode = "gym" | "custom";

type MinimalEventFormProps = {
  gyms: Gym[];
  defaultGymId?: string;
};

export function MinimalEventForm({ gyms, defaultGymId }: MinimalEventFormProps) {
  const router = useRouter();
  const initialGymId =
    defaultGymId && gyms.some((gym) => gym.id === defaultGymId)
      ? defaultGymId
      : gyms[0]?.id ?? "";

  const [gymId, setGymId] = useState(initialGymId);
  const [eventType, setEventType] = useState<EventType>("open_mat");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>("gym");
  const [customLocation, setCustomLocation] = useState<GymAddressValue>(
    createEmptyGymAddress(),
  );
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGym = useMemo(
    () => gyms.find((gym) => gym.id === gymId) ?? gyms[0],
    [gymId, gyms],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedGym) {
      setError("체육관을 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      setError("이벤트 제목을 입력해주세요.");
      return;
    }
    if (!eventDate) {
      setError("날짜를 선택해주세요.");
      return;
    }
    if (!eventTime) {
      setError("시작 시간을 입력해주세요.");
      return;
    }

    const location =
      locationMode === "gym"
        ? getEventLocationDefaults(null, selectedGym)
        : customLocation;
    const locationError = validateEventLocation(location);
    if (locationError) {
      setError(
        locationMode === "gym"
          ? "체육관 주소를 확인할 수 없습니다. 체육관 정보를 수정하거나 다른 장소를 선택해주세요."
          : locationError,
      );
      return;
    }

    const parsedMaxParticipants = maxParticipants.trim()
      ? Number.parseInt(maxParticipants, 10)
      : null;
    if (
      parsedMaxParticipants != null &&
      (Number.isNaN(parsedMaxParticipants) || parsedMaxParticipants < 1)
    ) {
      setError("참가 인원은 1명 이상으로 입력해주세요.");
      return;
    }

    const parsedFee = feeAmount.trim()
      ? Number.parseInt(feeAmount.replace(/,/g, ""), 10)
      : null;
    if (parsedFee != null && (Number.isNaN(parsedFee) || parsedFee < 0)) {
      setError("참가비를 올바르게 입력해주세요.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login?redirect=/events/new");
      return;
    }

    const locationPayload = eventLocationToPayload(location);
    const { data: inserted, error: insertError } = await supabase
      .from("events")
      .insert({
        gym_id: selectedGym.id,
        created_by: user.id,
        title: title.trim(),
        event_type: eventType,
        sport: (selectedGym.sport ?? "유도").trim(),
        region: locationPayload.region,
        address: locationPayload.address,
        event_date: eventDate,
        event_time: eventTime,
        max_participants: parsedMaxParticipants,
        fee_amount: parsedFee && parsedFee > 0 ? parsedFee : null,
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertError || !inserted) {
      setError(insertError?.message ?? "이벤트 등록에 실패했습니다.");
      return;
    }

    router.push(`/events/${inserted.id}/created`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert message={error} />}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">기본 정보</p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
            체육관
            <select
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal"
            >
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
            이벤트 유형 <span className="text-orange-600">*</span>
            <select
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal"
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
            제목 <span className="text-orange-600">*</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 토요일 자유 오픈매트"
              className="rounded-lg border border-zinc-300 px-3 py-2.5 font-normal"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              날짜 <span className="text-orange-600">*</span>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              시작 시간 <span className="text-orange-600">*</span>
              <input
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2.5 font-normal"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">장소</p>
        <p className="mt-1 text-xs text-zinc-500">
          대부분의 이벤트는 등록한 체육관에서 열립니다.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLocationMode("gym")}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
              locationMode === "gym"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            체육관과 동일
          </button>
          <button
            type="button"
            onClick={() => setLocationMode("custom")}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
              locationMode === "custom"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            다른 장소
          </button>
        </div>

        {locationMode === "gym" ? (
          <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">{selectedGym?.name}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {selectedGym?.address || selectedGym?.region || "체육관 주소 미등록"}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <EventLocationFields
              value={customLocation}
              onChange={setCustomLocation}
              selectedGym={selectedGym}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setShowOptional((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-zinc-900">
              정원·참가비
            </span>
            <span className="mt-1 block text-xs text-zinc-500">
              지금 정하지 않아도 나중에 수정할 수 있어요.
            </span>
          </span>
          <span className="text-sm text-zinc-500">
            {showOptional ? "접기" : "선택"}
          </span>
        </button>

        {showOptional && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              정원
              <input
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="제한 없음"
                className="rounded-lg border border-zinc-300 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
              참가비
              <input
                type="number"
                min={0}
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="무료"
                className="rounded-lg border border-zinc-300 px-3 py-2.5 font-normal"
              />
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-orange-600 py-3.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {saving ? "만드는 중..." : "이벤트 만들기"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        신청 마감, 난이도, 참가 안내와 안전 규칙은 이벤트 생성 후 추가할 수 있습니다.
      </p>
    </form>
  );
}
