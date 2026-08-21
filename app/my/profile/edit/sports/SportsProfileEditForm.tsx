"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { TreeMultiSelect } from "@/components/TreeMultiSelect";
import { ToggleGroup } from "@/components/ToggleGroup";
import { REGION_TREE } from "@/lib/constants/regions";
import { SIGNUP_SPORT_OPTIONS } from "@/lib/constants/sports";
import {
  buildExperience,
  EXPERIENCE_TYPE_OPTIONS,
  EXPERIENCE_YEARS_OPTIONS,
  GENDER_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
  getWeightClassOptionsForGender,
  isWeightClassValidForGender,
  resolveProfileExperience,
} from "@/lib/constants/profile";

function parseExperience(experience: string | null) {
  if (!experience) return { type: "", years: "" };
  if (experience === GYM_OPERATOR_EXPERIENCE) return { type: GYM_OPERATOR_EXPERIENCE, years: "" };
  if (experience === "엘리트 선수") return { type: "엘리트 선수", years: "" };
  if (experience.startsWith("일반 수련자 · ")) {
    return { type: "일반 수련자", years: experience.replace("일반 수련자 · ", "") };
  }
  return { type: "", years: "" };
}

export default function SportsProfileEditForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [preferredSports, setPreferredSports] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [experienceType, setExperienceType] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [gender, setGender] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [isGymOperator, setIsGymOperator] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/my/profile/edit/sports");
        return;
      }

      const [{ data, error: fetchError }, { data: gyms }] = await Promise.all([
        supabase
          .from("profiles")
          .select("preferred_sports, regions, experience, gender, weight_class")
          .eq("id", user.id)
          .single(),
        supabase.from("gyms").select("id").eq("owner_id", user.id).limit(1),
      ]);

      if (fetchError || !data) {
        router.push("/my/profile");
        return;
      }

      const parsed = parseExperience(data.experience);
      setUserId(user.id);
      setPreferredSports(data.preferred_sports ?? []);
      setRegions(data.regions ?? []);
      setExperienceType(parsed.type);
      setExperienceYears(parsed.years);
      setGender(data.gender ?? "");
      setWeightClass(data.weight_class ?? "");
      setIsGymOperator((gyms?.length ?? 0) > 0);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const selectedSport = preferredSports[0] ?? "";
  const isJudo = selectedSport === "유도";
  const weightClassOptions = useMemo(() => getWeightClassOptionsForGender(gender), [gender]);

  useEffect(() => {
    if (weightClass && !isWeightClassValidForGender(weightClass, gender)) {
      setWeightClass("");
    }
  }, [gender, weightClass]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;

    let experience: string | null = null;
    if (isGymOperator) {
      experience = GYM_OPERATOR_EXPERIENCE;
    } else if (experienceType === "엘리트 선수") {
      experience = "엘리트 선수";
    } else if (experienceType === "일반 수련자") {
      experience = buildExperience(experienceType, experienceYears);
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        preferred_sports: preferredSports,
        regions,
        experience: resolveProfileExperience(experience, isGymOperator),
        gender: isJudo ? gender || null : null,
        weight_class: isJudo ? weightClass || null : null,
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

  if (loading) return <p className="text-sm text-zinc-600">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-md">
      <Link href="/my/profile" className="text-sm font-medium text-orange-600 hover:text-orange-700">
        ← 프로필
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900">프로필 관리</h1>
      <p className="mt-1 text-sm text-zinc-500">운동에 필요한 정보만 필요할 때 채워주세요.</p>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-sm font-medium">
        <Link href="/my/profile/edit" className="rounded-lg px-3 py-2 text-center text-zinc-500 hover:text-zinc-900">
          기본 프로필
        </Link>
        <span className="rounded-lg bg-white px-3 py-2 text-center text-zinc-900 shadow-sm">운동 프로필</span>
      </div>

      {error && <div className="mt-4"><Alert message={error} /></div>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">기본 운동 정보</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">비워둬도 괜찮아요. 이벤트 참가 시 필요한 정보는 그때 입력할 수 있습니다.</p>

          <div className="mt-5 flex flex-col gap-5">
            <ChipMultiSelect
              label="주 종목"
              options={SIGNUP_SPORT_OPTIONS}
              values={preferredSports}
              onChange={setPreferredSports}
              single
            />

            {isGymOperator ? (
              <div>
                <p className="text-sm font-medium text-zinc-800">수련 배경</p>
                <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-800">
                  {GYM_OPERATOR_EXPERIENCE}
                </p>
                <p className="mt-1 text-xs text-zinc-500">체육관 운영자는 지도자로 표시됩니다.</p>
              </div>
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
                />
                {experienceType === "일반 수련자" && (
                  <ToggleGroup
                    label="수련 경력"
                    options={EXPERIENCE_YEARS_OPTIONS}
                    value={experienceYears}
                    onChange={setExperienceYears}
                  />
                )}
              </>
            )}

            <TreeMultiSelect
              label="활동 지역"
              labelNote="복수 선택 가능"
              nodes={REGION_TREE}
              values={regions}
              onChange={setRegions}
              exclusiveValue="전국"
            />
          </div>
        </section>

        {isJudo && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">유도 참가 정보 <span className="text-sm font-normal text-zinc-400">(선택)</span></h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">체급을 미리 저장하면 이벤트 신청할 때 자동으로 불러올 수 있어요.</p>

            <div className="mt-5 flex flex-col gap-5">
              <ToggleGroup label="성별" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
              {gender && (
                <ToggleGroup label="체급" options={weightClassOptions} value={weightClass} onChange={setWeightClass} />
              )}
            </div>
          </section>
        )}

        <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "저장 중..." : "운동 프로필 저장"}
        </button>
      </form>
    </div>
  );
}
