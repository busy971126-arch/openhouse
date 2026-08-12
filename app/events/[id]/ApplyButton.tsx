"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ApplyPreviewHintBox } from "@/components/events/ApplyPreviewHintBox";
import {
  APPLICANT_BACKGROUND_OPTIONS,
  APPLICANT_YEARS_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
  getWeightClassOptionsForGender,
} from "@/lib/constants/profile";
import { buildApplyPreviewHint } from "@/lib/utils/apply-preview-hint";
import {
  buildApplyExperience,
  getApplicantBackgroundOptions,
  isAthleteBackgroundProfile,
  parseApplyExperience,
} from "@/lib/utils/experience-apply";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";
import type { Registration } from "@/lib/types/database";

type ApplyButtonProps = {
  eventId: string;
  userId: string | null;
  existingRegistration: Registration | null;
  canApply?: boolean;
  closedReason?: string;
  weightClass?: string | null;
  gender?: string | null;
  experience?: string | null;
  isGymOperator?: boolean;
  preview?: ParticipantPreview | null;
};

export function ApplyButton({
  eventId,
  userId,
  existingRegistration,
  canApply = true,
  closedReason,
  weightClass,
  gender,
  experience,
  isGymOperator = false,
  preview,
}: ApplyButtonProps) {
  const router = useRouter();
  const profileExperience = isGymOperator
    ? GYM_OPERATOR_EXPERIENCE
    : experience;
  const initial = useMemo(
    () => parseApplyExperience(profileExperience),
    [profileExperience],
  );
  const isAthleteProfile = useMemo(
    () => isAthleteBackgroundProfile(profileExperience),
    [profileExperience],
  );
  const backgroundOptions = useMemo(
    () => getApplicantBackgroundOptions(profileExperience),
    [profileExperience],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeightClass, setSelectedWeightClass] = useState(
    weightClass?.trim() ?? "",
  );
  const [background, setBackground] = useState<
    (typeof APPLICANT_BACKGROUND_OPTIONS)[number]["value"] | ""
  >(() =>
    isGymOperator
      ? "지도자"
      : isAthleteBackgroundProfile(profileExperience)
        ? "선수 출신"
        : initial.background,
  );
  const [years, setYears] = useState<
    (typeof APPLICANT_YEARS_OPTIONS)[number]["value"] | ""
  >(initial.years);
  const [gymAffiliation, setGymAffiliation] = useState("");
  const [applicantNotes, setApplicantNotes] = useState("");
  const [seekingSparring, setSeekingSparring] = useState(false);

  const previewExperience = isGymOperator
    ? GYM_OPERATOR_EXPERIENCE
    : background && (background !== "일반 수련자" || years)
      ? buildApplyExperience(background, years) ?? profileExperience
      : profileExperience;

  const previewHint = buildApplyPreviewHint(
    preview ?? null,
    selectedWeightClass,
    previewExperience,
  );
  const weightClassOptions = useMemo(
    () => getWeightClassOptionsForGender(gender),
    [gender],
  );

  if (!userId) {
    return (
      <div className="flex flex-col gap-3">
        <ApplyPreviewHintBox hint={previewHint} />
        <a
          href={`/login?redirect=/events/${eventId}`}
          className="block rounded-lg bg-orange-600 py-3 text-center font-medium text-white hover:bg-orange-700"
        >
          로그인 후 참가 신청
        </a>
      </div>
    );
  }

  if (existingRegistration) {
    const label =
      existingRegistration.status === "pending"
        ? "승인 대기 중"
        : "참가 확정됨";
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-800">{label}</p>
        {existingRegistration.seeking_sparring_partner && (
          <p className="mt-1 text-xs text-green-700">
            대련 상대 찾기 등록됨
          </p>
        )}
        <Link
          href="/my/registrations"
          className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          내 일정에서 보기 →
        </Link>
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="rounded-lg bg-zinc-100 py-3 text-center text-sm font-medium text-zinc-600">
        {closedReason ?? "참가 신청이 마감되었습니다."}
      </div>
    );
  }

  async function handleApply() {
    if (!selectedWeightClass.trim()) {
      setError("체급을 선택해주세요.");
      return;
    }

    if (!background && !isGymOperator) {
      setError("수련 배경을 선택해주세요.");
      return;
    }

    if (isAthleteProfile && background === "일반 수련자") {
      setError("엘리트 선수 출신 프로필은 일반 수련자로 신청할 수 없습니다.");
      return;
    }

    if (background === "일반 수련자" && !years) {
      setError("수련 기간을 선택해주세요.");
      return;
    }

    const applyExperience = isGymOperator
      ? GYM_OPERATOR_EXPERIENCE
      : buildApplyExperience(background, years);
    if (!applyExperience) {
      setError("수련 정보를 확인해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("registrations").insert({
      event_id: eventId,
      user_id: userId,
      status: "pending",
      seeking_sparring_partner: seekingSparring,
      sparring_intensity: null,
      apply_weight_class: selectedWeightClass.trim(),
      apply_experience: applyExperience,
      gym_affiliation: gymAffiliation.trim() || null,
      applicant_notes: applicantNotes.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    window.alert("참가 신청이 완료되었습니다.");
    router.push(`/events/${eventId}/apply/complete`);
  }

  return (
    <div className="flex flex-col gap-3">
      <ApplyPreviewHintBox hint={previewHint} />

      {error && <Alert message={error} />}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">참가 정보</p>
        <p className="mt-1 text-xs text-zinc-500">
          체급·수련 정보는 다른 참가자에게 공개됩니다. 실명과 연락처는 공개되지
          않습니다.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            체급 <span className="text-red-600">*</span>
            <select
              required
              value={selectedWeightClass}
              onChange={(e) => setSelectedWeightClass(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              <option value="">선택</option>
              {weightClassOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isGymOperator ? (
            <div className="flex flex-col gap-1 text-sm">
              <span>수련 배경</span>
              <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800">
                {GYM_OPERATOR_EXPERIENCE}
              </p>
              <span className="text-xs text-zinc-500">
                체육관 운영자는 지도자로 신청됩니다.
              </span>
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                수련 배경 <span className="text-red-600">*</span>
                <select
                  required
                  value={background}
                  onChange={(e) => {
                    setBackground(
                      e.target.value as (typeof APPLICANT_BACKGROUND_OPTIONS)[number]["value"] | "",
                    );
                    if (e.target.value !== "일반 수련자") {
                      setYears("");
                    }
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
                >
                  <option value="">선택</option>
                  {backgroundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isAthleteProfile && (
                  <span className="text-xs text-zinc-500">
                    엘리트 선수 출신 프로필은 일반 수련자로 신청할 수 없습니다.
                  </span>
                )}
              </label>

              {background === "일반 수련자" && (
                <label className="flex flex-col gap-1 text-sm">
                  수련 기간 <span className="text-red-600">*</span>
                  <select
                    required
                    value={years}
                    onChange={(e) =>
                      setYears(
                        e.target.value as (typeof APPLICANT_YEARS_OPTIONS)[number]["value"] | "",
                      )
                    }
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
                  >
                    <option value="">선택</option>
                    {APPLICANT_YEARS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          <label className="flex flex-col gap-1 text-sm">
            소속 도장 (선택)
            <input
              value={gymAffiliation}
              onChange={(e) => setGymAffiliation(e.target.value)}
              placeholder="예: OO 유도장"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            요청 사항 (선택)
            <textarea
              value={applicantNotes}
              onChange={(e) => setApplicantNotes(e.target.value)}
              rows={2}
              placeholder="호스트에게 전달할 메모"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            />
          </label>
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <input
          type="checkbox"
          checked={seekingSparring}
          onChange={(e) => setSeekingSparring(e.target.checked)}
          className="mt-0.5 size-4 rounded border-zinc-300"
        />
        <span>
          <span className="font-medium text-zinc-900">
            대련 상대를 찾고 있어요
          </span>
          <span className="mt-1 block text-xs text-zinc-500">
            체급·수련 경력·닉네임만 공개됩니다.
          </span>
        </span>
      </label>

      {seekingSparring && !selectedWeightClass.trim() && (
        <p className="text-sm text-orange-800">
          대련 찾기는 체급 선택이 필요합니다.{" "}
          <Link href="/my/profile/edit" className="font-medium underline">
            프로필
          </Link>
          에서 기본 체급을 저장해두면 편해요.
        </p>
      )}

      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "신청 중..." : "참가 신청"}
      </button>
    </div>
  );
}
