"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressSearchField } from "@/components/AddressSearchField";
import { Alert } from "@/components/Alert";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { RepresentativeRoleFields } from "@/components/gym/RepresentativeRoleFields";
import { SignupField, SignupInput } from "@/components/SignupField";
import { SignupSection } from "@/components/SignupSection";
import { SIGNUP_SPORT_OPTIONS } from "@/lib/constants/sports";
import {
  serializeRepresentativeRole,
  validateRepresentativeRole,
} from "@/lib/constants/gym-representative";
import { createClient } from "@/lib/supabase/client";
import {
  createEmptyGymAddress,
  formatGymAddress,
  type GymAddressValue,
} from "@/lib/utils/address-region";
import type { PendingGymFormDefaults } from "@/lib/utils/pending-gym-info";
import { formatPhoneInput, normalizePhone } from "@/lib/utils/phone";

type MinimalGymFormProps = {
  pendingDefaults?: PendingGymFormDefaults | null;
};

export function MinimalGymForm({ pendingDefaults = null }: MinimalGymFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<string[]>(["유도"]);
  const [gymAddress, setGymAddress] = useState<GymAddressValue>(
    createEmptyGymAddress(),
  );
  const [representativeName, setRepresentativeName] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [representativeRoleCustom, setRepresentativeRoleCustom] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/gym/new");
        return;
      }

      setUserId(user.id);

      if (pendingDefaults) {
        setName(pendingDefaults.name);
        setGymAddress(pendingDefaults.gymAddress);
        if (pendingDefaults.representativeName) {
          setRepresentativeName(pendingDefaults.representativeName);
        }
        if (pendingDefaults.representativePhone) {
          setRepresentativePhone(formatPhoneInput(pendingDefaults.representativePhone));
        }
        if (pendingDefaults.representativeRole) {
          setRepresentativeRole(pendingDefaults.representativeRole);
        }
        if (pendingDefaults.representativeRoleCustom) {
          setRepresentativeRoleCustom(pendingDefaults.representativeRoleCustom);
        }
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.display_name?.trim()) {
        setRepresentativeName(profile.display_name.trim());
      }
      if (profile?.phone?.trim()) {
        setRepresentativePhone(formatPhoneInput(profile.phone));
      }

      setLoading(false);
    }

    void loadUser();
  }, [pendingDefaults, router]);

  function validateForm() {
    if (!name.trim()) return "체육관 이름을 입력해주세요.";
    if (sport.length === 0) return "종목을 선택해주세요.";
    if (!gymAddress.roadAddress.trim()) return "주소 검색으로 주소를 입력해주세요.";
    if (!gymAddress.region.trim()) {
      return "주소에서 활동 지역을 확인할 수 없습니다. 다시 검색해주세요.";
    }
    if (!representativeName.trim()) return "담당자 이름을 입력해주세요.";
    if (!representativePhone.trim()) return "담당자 연락처를 입력해주세요.";
    return validateRepresentativeRole(representativeRole, representativeRoleCustom);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userId) return;
    setSaving(true);

    const supabase = createClient();
    const rolePayload = serializeRepresentativeRole(
      representativeRole,
      representativeRoleCustom,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("gyms")
      .insert({
        owner_id: userId,
        name: name.trim(),
        sport: sport[0],
        region: gymAddress.region.trim(),
        address: formatGymAddress(gymAddress),
        is_public: true,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setSaving(false);
      setError(insertError?.message ?? "체육관 등록에 실패했습니다.");
      return;
    }

    const { error: contactError } = await supabase
      .from("gym_private_contacts")
      .insert({
        gym_id: inserted.id,
        representative_name: representativeName.trim(),
        representative_phone: normalizePhone(representativePhone),
        ...rolePayload,
        updated_at: new Date().toISOString(),
      });

    if (contactError) {
      await supabase.from("gyms").delete().eq("id", inserted.id);
      setSaving(false);
      setError(
        contactError.message ||
          "담당자 정보 저장에 실패하여 체육관 등록을 취소했습니다.",
      );
      return;
    }

    await supabase
      .from("profiles")
      .update({ experience: "지도자", pending_gym_info: null })
      .eq("id", userId);

    router.push(`/gym/${inserted.id}/registered`);
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">계정 정보를 확인하고 있어요...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert message={error} />}

      <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-950">
        <p className="font-semibold">먼저 체육관만 등록해두세요.</p>
        <p className="mt-0.5 text-orange-900/80">
          사진, 시간표, 시설 정보는 등록 후 천천히 추가할 수 있어요.
        </p>
      </div>

      <SignupSection title="기본 정보">
        <SignupField label="체육관 이름" required>
          <SignupInput
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: ○○ 유도장"
          />
        </SignupField>

        <ChipMultiSelect
          label="종목"
          required
          options={SIGNUP_SPORT_OPTIONS}
          values={sport}
          onChange={setSport}
          single
        />

        <AddressSearchField
          value={gymAddress}
          onChange={setGymAddress}
          required
        />
      </SignupSection>

      <SignupSection title="담당자 확인">
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          운영자 확인을 위한 정보예요. 담당자 연락처는 참가자에게 공개되지 않습니다.
        </p>

        <SignupField label="담당자 이름" required>
          <SignupInput
            required
            value={representativeName}
            onChange={(event) => setRepresentativeName(event.target.value)}
            autoComplete="name"
          />
        </SignupField>

        <RepresentativeRoleFields
          role={representativeRole}
          onRoleChange={setRepresentativeRole}
          customRole={representativeRoleCustom}
          onCustomRoleChange={setRepresentativeRoleCustom}
        />

        <SignupField label="담당자 연락처" required>
          <SignupInput
            type="tel"
            required
            value={representativePhone}
            onChange={(event) =>
              setRepresentativePhone(formatPhoneInput(event.target.value))
            }
            placeholder="010-0000-0000"
            inputMode="tel"
            autoComplete="tel"
          />
        </SignupField>
      </SignupSection>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "등록 중..." : "체육관 등록하기"}
      </button>

      <p className="text-center text-xs leading-5 text-zinc-500">
        대표사진 · 수업 시간표 · 시설 · 공개 연락처는 등록 후 추가합니다.
      </p>
    </form>
  );
}
