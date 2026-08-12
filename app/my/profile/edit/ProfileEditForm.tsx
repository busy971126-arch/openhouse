"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ProfileBioInput } from "@/components/profile/ProfileBioInput";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { NicknameField } from "@/components/NicknameField";
import { SignupField, SignupInput } from "@/components/SignupField";
import { SignupSection } from "@/components/SignupSection";
import { TreeMultiSelect } from "@/components/TreeMultiSelect";
import { ToggleGroup } from "@/components/ToggleGroup";
import { REGION_TREE } from "@/lib/constants/regions";
import {
  buildExperience,
  EXPERIENCE_TYPE_OPTIONS,
  EXPERIENCE_YEARS_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
  getWeightClassOptionsForGender,
  isWeightClassValidForGender,
  resolveProfileExperience,
} from "@/lib/constants/profile";
import { SIGNUP_SPORT_OPTIONS } from "@/lib/constants/sports";

function parseExperience(experience: string | null) {
  if (!experience) return { type: "", years: "" };
  if (experience === GYM_OPERATOR_EXPERIENCE) {
    return { type: GYM_OPERATOR_EXPERIENCE, years: "" };
  }
  if (experience === "엘리트 선수") return { type: "엘리트 선수", years: "" };
  if (experience.startsWith("일반 수련자 · ")) {
    return {
      type: "일반 수련자",
      years: experience.replace("일반 수련자 · ", ""),
    };
  }
  return { type: "", years: "" };
}

export default function ProfileEditForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [preferredSports, setPreferredSports] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [experienceType, setExperienceType] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [isGymOperator, setIsGymOperator] = useState(false);
  const [primaryGymName, setPrimaryGymName] = useState<string | null>(null);
  const [primaryGymId, setPrimaryGymId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/my/profile/edit");
        return;
      }

      setUserId(user.id);

      const [{ data, error: fetchError }, { data: gyms }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("gyms")
          .select("id, name")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (fetchError || !data) {
        router.push("/my");
        return;
      }

      setIsGymOperator((gyms?.length ?? 0) > 0);
      setPrimaryGymName(gyms?.[0]?.name ?? null);
      setPrimaryGymId(gyms?.[0]?.id ?? null);

      const parsed = parseExperience(data.experience);
      setDisplayName(data.display_name ?? "");
      setNickname(data.nickname ?? "");
      setVerifiedNickname(data.nickname?.trim() ? data.nickname.trim() : null);
      setPreferredSports(data.preferred_sports ?? []);
      setRegions(data.regions ?? []);
      setExperienceType(parsed.type);
      setExperienceYears(parsed.years);
      setWeightClass(data.weight_class ?? "");
      setGender(data.gender ?? "");
      setBio(data.bio ?? "");
      setPhotoUrl(data.photo_url ?? "");
      setPhotoPreview(data.photo_url ?? null);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const weightClassOptions = useMemo(
    () => getWeightClassOptionsForGender(gender),
    [gender],
  );

  useEffect(() => {
    if (weightClass && !isWeightClassValidForGender(weightClass, gender)) {
      setWeightClass("");
    }
  }, [gender, weightClass]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setPendingPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function uploadPhoto(file: File, ownerId: string) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${ownerId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) return null;
    return supabase.storage.from("profile-photos").getPublicUrl(path).data
      .publicUrl;
  }

  async function resolveNicknameForSave(): Promise<
    { ok: true; nickname: string } | { ok: false }
  > {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return { ok: false };
    }

    if (verifiedNickname !== null && trimmed === verifiedNickname) {
      return { ok: true, nickname: verifiedNickname };
    }

    const response = await fetch("/api/nickname/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: trimmed }),
    });
    const data = await response.json();

    if (!response.ok || !data.available) {
      setError(
        data.error ??
          "닉네임 중복확인이 필요합니다. 중복확인 버튼을 눌러주세요.",
      );
      return { ok: false };
    }

    const resolved = data.nickname as string;
    setNickname(resolved);
    setVerifiedNickname(resolved);
    return { ok: true, nickname: resolved };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    const nicknameResult = await resolveNicknameForSave();
    if (!nicknameResult.ok) return;

    if (preferredSports.length === 0) {
      setError("종목을 선택해주세요.");
      return;
    }

    if (regions.length === 0) {
      setError("지역을 선택해주세요.");
      return;
    }

    const experience = resolveProfileExperience(
      buildExperience(experienceType, experienceYears),
      isGymOperator,
    );
    if (!experience) {
      setError("수련 배경을 선택해주세요.");
      return;
    }

    if (!userId) return;

    setSaving(true);

    let nextPhotoUrl = photoUrl.trim() || null;
    if (pendingPhoto) {
      const uploaded = await uploadPhoto(pendingPhoto, userId);
      if (!uploaded) {
        setSaving(false);
        setError("프로필 사진 업로드에 실패했습니다.");
        return;
      }
      nextPhotoUrl = uploaded;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        nickname: nicknameResult.nickname,
        preferred_sports: preferredSports,
        regions,
        experience,
        weight_class: weightClass.trim() || null,
        bio: bio.trim() || null,
        photo_url: nextPhotoUrl,
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/my/profile");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">불러오는 중...</p>;
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/my/profile"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 프로필
      </Link>

      <h1 className="mb-6 mt-4 text-2xl font-bold text-zinc-900">프로필 수정</h1>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SignupSection title="공개 정보">
          <div className="flex flex-col items-center gap-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="프로필"
                className="size-24 rounded-full border border-zinc-200 object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400">
                👤
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-orange-600"
            >
              프로필 사진 변경
            </button>
          </div>

          <NicknameField
            value={nickname}
            onChange={setNickname}
            verifiedNickname={verifiedNickname}
            onVerifiedChange={setVerifiedNickname}
          />

          <SignupField label="소개">
            <ProfileBioInput value={bio} onChange={setBio} />
          </SignupField>

          <ChipMultiSelect
            label="종목"
            options={SIGNUP_SPORT_OPTIONS}
            values={preferredSports}
            onChange={setPreferredSports}
            single
            required
          />

          <ToggleGroup
            label="체급"
            options={weightClassOptions}
            value={weightClass}
            onChange={setWeightClass}
          />
          {gender && (
            <p className="-mt-2 text-xs text-zinc-500">
              {gender === "여성" ? "여성" : "남성"} 유도 체급 기준입니다.
            </p>
          )}

          {isGymOperator ? (
            <SignupField label="수련 배경">
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-800">
                {GYM_OPERATOR_EXPERIENCE}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                체육관 직책·사진·시설은{" "}
                {primaryGymId ? (
                  <Link
                    href={`/gym/${primaryGymId}/edit`}
                    className="text-orange-600 underline"
                  >
                    체육관 정보 수정
                  </Link>
                ) : (
                  "체육관 정보 수정"
                )}
                에서 관리합니다.
              </p>
            </SignupField>
          ) : (
            <>
              <ToggleGroup
                label="수련 배경"
                options={EXPERIENCE_TYPE_OPTIONS}
                value={experienceType}
                onChange={(value) => {
                  setExperienceType(value);
                  if (value !== "일반 수련자") setExperienceYears("");
                }}
                required
              />

              {experienceType === "일반 수련자" && (
                <ToggleGroup
                  label="수련 경력"
                  options={EXPERIENCE_YEARS_OPTIONS}
                  value={experienceYears}
                  onChange={setExperienceYears}
                  required
                />
              )}
            </>
          )}

          <TreeMultiSelect
            label="지역"
            labelNote="복수 선택 가능"
            nodes={REGION_TREE}
            values={regions}
            onChange={setRegions}
            exclusiveValue="전국"
            required
          />
        </SignupSection>

        <SignupSection title="비공개 정보">
          <p className="mb-3 text-xs text-zinc-500">
            이름·연락처는 호스트에게만 공개됩니다.
          </p>
          <SignupField label="이름" required>
            <SignupInput
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </SignupField>
          <p className="text-xs text-zinc-500">
            전화번호·이메일은{" "}
            <Link href="/my/settings" className="text-orange-600 underline">
              설정
            </Link>
            에서 관리합니다.
          </p>
        </SignupSection>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "프로필 저장"}
        </button>
      </form>
    </div>
  );
}
