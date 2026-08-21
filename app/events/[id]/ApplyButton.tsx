"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { FieldLabel } from "@/components/FieldLabel";
import { ApplyPreviewHintBox } from "@/components/events/ApplyPreviewHintBox";
import { PartyFriendPicker } from "@/components/events/PartyFriendPicker";
import { ParticipantPartySummary } from "@/components/participants/ParticipantPartyBadge";
import {
  APPLICANT_BACKGROUND_OPTIONS,
  APPLICANT_YEARS_OPTIONS,
  GENDER_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
  getWeightClassOptionsForGender,
} from "@/lib/constants/profile";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneInput } from "@/lib/utils/phone";
import { buildApplyPreviewHint } from "@/lib/utils/apply-preview-hint";
import {
  buildApplyExperience,
  getApplicantBackgroundOptions,
  getApplyFormDefaultsFromProfile,
  isAthleteBackgroundProfile,
  type ApplicantBackground,
} from "@/lib/utils/experience-apply";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";
import { parseRegistrationApplyError } from "@/lib/utils/participant-party";
import type { Registration } from "@/lib/types/database";

type ApplyMode = "solo" | "party";

type ApplyButtonProps = {
  eventId: string;
  userId: string | null;
  existingRegistration: Registration | null;
  canApply?: boolean;
  closedReason?: string;
  weightClass?: string | null;
  gender?: string | null;
  experience?: string | null;
  displayName?: string | null;
  phone?: string | null;
  isGymOperator?: boolean;
  gymAffiliationDefault?: string | null;
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
  displayName,
  phone,
  isGymOperator = false,
  gymAffiliationDefault,
  preview,
}: ApplyButtonProps) {
  const router = useRouter();
  const profileExperience = isGymOperator ? GYM_OPERATOR_EXPERIENCE : experience;
  const defaults = useMemo(
    () =>
      getApplyFormDefaultsFromProfile({
        weightClass,
        experience,
        isGymOperator,
        gymAffiliation: gymAffiliationDefault,
      }),
    [weightClass, experience, isGymOperator, gymAffiliationDefault],
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
  const [profileLoading, setProfileLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState(displayName?.trim() ?? "");
  const [applicantPhone, setApplicantPhone] = useState(formatPhoneInput(phone ?? ""));
  const [selectedGender, setSelectedGender] = useState(gender?.trim() ?? "");
  const [selectedWeightClass, setSelectedWeightClass] = useState(defaults.weightClass);
  const [background, setBackground] = useState<
    (typeof APPLICANT_BACKGROUND_OPTIONS)[number]["value"] | ""
  >(defaults.background);
  const [years, setYears] = useState<
    (typeof APPLICANT_YEARS_OPTIONS)[number]["value"] | ""
  >(defaults.years);
  const [gymAffiliation, setGymAffiliation] = useState(defaults.gymAffiliation);
  const [applicantNotes, setApplicantNotes] = useState("");
  const [applyMode, setApplyMode] = useState<ApplyMode>("solo");
  const [companionIds, setCompanionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setProfileLoading(false);
      return;
    }

    let active = true;

    async function loadIdentity() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, gender, weight_class")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;

      if (data) {
        if (!applicantName.trim() && data.display_name?.trim()) {
          setApplicantName(data.display_name.trim());
        }
        if (!applicantPhone.trim() && data.phone?.trim()) {
          setApplicantPhone(formatPhoneInput(data.phone));
        }
        if (!selectedGender && data.gender?.trim()) {
          setSelectedGender(data.gender.trim());
        }
        if (!selectedWeightClass && data.weight_class?.trim()) {
          setSelectedWeightClass(data.weight_class.trim());
        }
      }

      setProfileLoading(false);
    }

    void loadIdentity();

    return () => {
      active = false;
    };
  }, [userId]);

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
    () => getWeightClassOptionsForGender(selectedGender),
    [selectedGender],
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
      existingRegistration.status === "pending" ? "승인 대기 중" : "참가 확정됨";
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-800">{label}</p>
        <ParticipantPartySummary
          partyId={existingRegistration.party_id}
          partyRepresentativeUserId={existingRegistration.party_representative_user_id}
          userId={userId}
        />
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
    if (!applicantName.trim()) {
      setError("실명을 입력해주세요.");
      return;
    }

    const phoneDigits = applicantPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("연락처를 올바르게 입력해주세요.");
      return;
    }

    if (!selectedGender) {
      setError("성별을 선택해주세요.");
      return;
    }

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
      : buildApplyExperience(background as ApplicantBackground, years);
    if (!applyExperience) {
      setError("수련 정보를 확인해주세요.");
      return;
    }

    if (applyMode === "party" && companionIds.length === 0) {
      setError("동행할 운동 친구를 1명 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: applyMode,
          applicantName: applicantName.trim(),
          applicantPhone,
          applicantGender: selectedGender,
          applyWeightClass: selectedWeightClass.trim(),
          applyExperience,
          gymAffiliation: gymAffiliation.trim() || null,
          applicantNotes: applicantNotes.trim() || null,
          companionUserIds: applyMode === "party" ? companionIds : undefined,
        }),
      });

      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(
          parseRegistrationApplyError(
            result.error ?? "참가 신청에 실패했습니다.",
            applyMode === "party" ? "동행 신청에 실패했습니다." : "참가 신청에 실패했습니다.",
          ),
        );
        return;
      }

      router.push(`/events/${eventId}/apply/complete`);
    } catch {
      setLoading(false);
      setError("참가 신청 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  if (profileLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        저장된 참가 정보를 불러오고 있어요...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ApplyPreviewHintBox hint={previewHint} />

      {error && <Alert message={error} />}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">참가 방식</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setApplyMode("solo")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              applyMode === "solo"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            혼자 신청
          </button>
          <button
            type="button"
            onClick={() => setApplyMode("party")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              applyMode === "party"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            운동 친구와 동행
          </button>
        </div>
      </div>

      {applyMode === "party" && userId && (
        <PartyFriendPicker
          viewerId={userId}
          selectedIds={companionIds}
          onChange={setCompanionIds}
        />
      )}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">신청자 확인</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          처음 한 번 입력하면 다음 신청부터 자동으로 불러옵니다. 실명과 연락처는 해당 이벤트 운영자에게만 제공됩니다.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <FieldLabel required tone="red">실명</FieldLabel>
            <input
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="예: 홍길동"
              autoComplete="name"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <FieldLabel required tone="red">연락처</FieldLabel>
            <input
              type="tel"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(formatPhoneInput(e.target.value))}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <FieldLabel required tone="red">성별</FieldLabel>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setSelectedWeightClass("");
              }}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              <option value="">선택</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">운동 정보</p>
        <p className="mt-1 text-xs text-zinc-500">
          체급과 수련 정보는 참가자 매칭과 운영을 위해 사용됩니다.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <FieldLabel required tone="red">체급</FieldLabel>
            <select
              required
              value={selectedWeightClass}
              disabled={!selectedGender}
              onChange={(e) => setSelectedWeightClass(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 disabled:bg-zinc-100"
            >
              <option value="">{selectedGender ? "선택" : "성별을 먼저 선택해주세요"}</option>
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
                <FieldLabel required tone="red">수련 배경</FieldLabel>
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
                  <FieldLabel required tone="red">수련 기간</FieldLabel>
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

      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "신청 중..." : applyMode === "party" ? "동행 신청" : "참가 신청"}
      </button>
    </div>
  );
}
