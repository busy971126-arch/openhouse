"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GymFormBlock, GymFormGroup } from "@/components/gym/GymFormBlock";
import { AddressSearchField } from "@/components/AddressSearchField";
import { Alert } from "@/components/Alert";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { ClassScheduleInput } from "@/components/gym/ClassScheduleInput";
import { FacilityInput } from "@/components/gym/FacilityInput";
import {
  GymPhotoCategoriesInput,
  type OptionalCategoryPhotos,
} from "@/components/gym/GymPhotoCategoriesInput";
import { GymFormPreviewPanel } from "@/components/gym/GymFormPreviewPanel";
import { GymProfileCompletionBar } from "@/components/gym/GymProfileCompletionBar";
import { RepresentativeRoleFields } from "@/components/gym/RepresentativeRoleFields";
import { SignupField, SignupInput } from "@/components/SignupField";
import { SignupSection } from "@/components/SignupSection";
import { ToggleGroup } from "@/components/ToggleGroup";
import { GYM_VISIBILITY_OPTIONS } from "@/lib/constants/gym";
import {
  serializeRepresentativeRole,
  validateRepresentativeRole,
} from "@/lib/constants/gym-representative";
import type { GymOptionalPhotoCategory } from "@/lib/constants/gym-photos";
import { SIGNUP_SPORT_OPTIONS } from "@/lib/constants/sports";
import { createClient } from "@/lib/supabase/client";
import {
  createEmptyGymAddress,
  formatGymAddress,
  gymAddressFromStored,
  type GymAddressValue,
} from "@/lib/utils/address-region";
import { getTodayDateString } from "@/lib/utils/date";
import {
  parseClassSchedule,
  serializeClassSchedule,
  deriveOperatingHoursFromSchedule,
  type ClassScheduleEntry,
} from "@/lib/utils/class-schedule";
import {
  parseGymFacilities,
  serializeGymFacilities,
  type GymFacilityFields,
} from "@/lib/utils/gym-facilities";
import {
  createEmptyOptionalCategoryPhotos,
  parseGymPhotoItems,
} from "@/lib/utils/gym-photo-items";
import {
  uploadGymPhotoFile,
  uploadOptionalGymPhotos,
} from "@/lib/utils/gym-photo-upload";
import { getGymProfileCompletion } from "@/lib/utils/gym-profile-completion";
import type { PendingGymFormDefaults } from "@/lib/utils/pending-gym-info";
import { formatPhoneInput, normalizePhone } from "@/lib/utils/phone";

type GymFormProps = {
  mode: "create" | "edit";
  gymId?: string;
  pendingDefaults?: PendingGymFormDefaults | null;
};

function createEmptyOptionalPending(): Record<
  GymOptionalPhotoCategory,
  { file: File; caption: string }[]
> {
  return {
    mat: [],
    facilities: [],
    exterior: [],
    parking: [],
  };
}

export function GymForm({ mode, gymId, pendingDefaults = null }: GymFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<string[]>([]);
  const [gymAddress, setGymAddress] = useState<GymAddressValue>(
    createEmptyGymAddress(),
  );
  const [phone, setPhone] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [representativeRoleCustom, setRepresentativeRoleCustom] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [classSchedule, setClassSchedule] = useState<ClassScheduleEntry[]>([]);
  const [operatingHours, setOperatingHours] = useState("");
  const [isOperatingHoursAuto, setIsOperatingHoursAuto] = useState(false);
  const [closedDays, setClosedDays] = useState("");
  const [facilityFields, setFacilityFields] = useState<GymFacilityFields>({
    selected: [],
    parkingType: null,
    notes: "",
  });
  const [visibility, setVisibility] = useState("public");
  const [photoUrl, setPhotoUrl] = useState("");
  const [pendingRepresentative, setPendingRepresentative] = useState<File | null>(
    null,
  );
  const [representativePreview, setRepresentativePreview] = useState<
    string | null
  >(null);
  const [optionalPhotos, setOptionalPhotos] = useState<OptionalCategoryPhotos>(
    createEmptyOptionalCategoryPhotos,
  );
  const [optionalPendingFiles, setOptionalPendingFiles] = useState(
    createEmptyOptionalPending,
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPrefillApplied, setPendingPrefillApplied] = useState(false);

  const profileCompletion = useMemo(
    () =>
      getGymProfileCompletion({
        facilityFields,
        operatingHours,
        classSchedule,
        closedDays,
        phone,
        instagramUrl,
        homepageUrl,
        optionalPhotos,
      }),
    [
      facilityFields,
      operatingHours,
      classSchedule,
      closedDays,
      phone,
      instagramUrl,
      homepageUrl,
      optionalPhotos,
    ],
  );

  useEffect(() => {
    if (!isEdit || !gymId) return;

    async function loadGym() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error: fetchError } = await supabase
        .from("gyms")
        .select("*")
        .eq("id", gymId)
        .eq("owner_id", user.id)
        .single();

      if (fetchError || !data) {
        router.push("/my/profile");
        return;
      }

      setName(data.name);
      setSport(data.sport ? [data.sport] : []);
      setGymAddress(gymAddressFromStored(data.address, data.region));
      setRepresentativeName(data.representative_name ?? "");
      setRepresentativeRole(data.representative_role ?? "");
      setRepresentativeRoleCustom(data.representative_role_custom ?? "");
      setRepresentativePhone(
        formatPhoneInput(data.representative_phone ?? data.phone ?? ""),
      );
      setPhone(data.phone ? formatPhoneInput(data.phone) : "");
      setInstagramUrl(data.instagram_url ?? data.sns_url ?? "");
      setHomepageUrl(data.homepage_url ?? "");
      const loadedSchedule = parseClassSchedule(data.class_schedule);
      setClassSchedule(loadedSchedule);
      const derivedHours = deriveOperatingHoursFromSchedule(loadedSchedule);
      if (derivedHours) {
        setOperatingHours(derivedHours);
        setIsOperatingHoursAuto(true);
      } else {
        setOperatingHours(data.operating_hours ?? "");
        setIsOperatingHoursAuto(false);
      }
      setClosedDays(data.closed_days ?? "");
      setFacilityFields(
        parseGymFacilities(data.facilities, data.facility_notes),
      );
      setVisibility(data.is_public === false ? "private" : "public");
      setPhotoUrl(data.photo_url ?? "");
      setRepresentativePreview(data.photo_url ?? null);
      setOptionalPhotos({
        mat: {
          items: [
            ...parseGymPhotoItems(data.mat_photos),
            ...parseGymPhotoItems(data.facility_photos),
          ],
          pendingPreviews: [],
          pendingCaptions: [],
        },
        facilities: {
          items: [],
          pendingPreviews: [],
          pendingCaptions: [],
        },
        exterior: {
          items: parseGymPhotoItems(data.exterior_photos),
          pendingPreviews: [],
          pendingCaptions: [],
        },
        parking: {
          items: parseGymPhotoItems(data.parking_photos),
          pendingPreviews: [],
          pendingCaptions: [],
        },
      });
      setOptionalPendingFiles(createEmptyOptionalPending());
      setLoading(false);
    }

    loadGym();
  }, [gymId, isEdit, router]);

  useEffect(() => {
    if (isEdit) return;

    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
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
        if (pendingDefaults.phone) {
          setPhone(formatPhoneInput(pendingDefaults.phone));
        }
        if (pendingDefaults.representativeRole) {
          setRepresentativeRole(pendingDefaults.representativeRole);
        }
        if (pendingDefaults.representativeRoleCustom) {
          setRepresentativeRoleCustom(pendingDefaults.representativeRoleCustom);
        }
        setPendingPrefillApplied(true);
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
    }

    loadUser();
  }, [isEdit, pendingDefaults, router]);

  function handleRepresentativeSelect(file: File) {
    setRepresentativePreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(file);
    });
    setPendingRepresentative(file);
    setError(null);
  }

  function handleOptionalAdd(
    category: GymOptionalPhotoCategory,
    files: File[],
  ) {
    const previews = files.map((file) => URL.createObjectURL(file));
    setOptionalPhotos((current) => ({
      ...current,
      [category]: {
        items: current[category].items,
        pendingPreviews: [...current[category].pendingPreviews, ...previews],
        pendingCaptions: [
          ...current[category].pendingCaptions,
          ...files.map(() => ""),
        ],
      },
    }));
    setOptionalPendingFiles((current) => ({
      ...current,
      [category]: [
        ...current[category],
        ...files.map((file) => ({ file, caption: "" })),
      ],
    }));
    setError(null);
  }

  function handleOptionalRemoveItem(
    category: GymOptionalPhotoCategory,
    index: number,
  ) {
    setOptionalPhotos((current) => ({
      ...current,
      [category]: {
        ...current[category],
        items: current[category].items.filter((_, i) => i !== index),
      },
    }));
  }

  function handleOptionalCaptionChange(
    category: GymOptionalPhotoCategory,
    index: number,
    kind: "saved" | "pending",
    caption: string,
  ) {
    setOptionalPhotos((current) => {
      if (kind === "saved") {
        return {
          ...current,
          [category]: {
            ...current[category],
            items: current[category].items.map((item, i) =>
              i === index ? { ...item, caption } : item,
            ),
          },
        };
      }

      return {
        ...current,
        [category]: {
          ...current[category],
          pendingCaptions: current[category].pendingCaptions.map((value, i) =>
            i === index ? caption : value,
          ),
        },
      };
    });

    if (kind === "pending") {
      setOptionalPendingFiles((current) => ({
        ...current,
        [category]: current[category].map((entry, i) =>
          i === index ? { ...entry, caption } : entry,
        ),
      }));
    }
  }

  function handleOptionalRemovePending(
    category: GymOptionalPhotoCategory,
    index: number,
  ) {
    setOptionalPhotos((current) => {
      const preview = current[category].pendingPreviews[index];
      if (preview) URL.revokeObjectURL(preview);
      return {
        ...current,
        [category]: {
          items: current[category].items,
          pendingPreviews: current[category].pendingPreviews.filter(
            (_, i) => i !== index,
          ),
          pendingCaptions: current[category].pendingCaptions.filter(
            (_, i) => i !== index,
          ),
        },
      };
    });
    setOptionalPendingFiles((current) => ({
      ...current,
      [category]: current[category].filter((_, i) => i !== index),
    }));
  }

  async function buildPhotoPayload(targetGymId: string, ownerId: string) {
    let nextPhotoUrl = photoUrl.trim() || null;

    if (pendingRepresentative) {
      const { url, error: uploadError } = await uploadGymPhotoFile(
        pendingRepresentative,
        ownerId,
        targetGymId,
        "representative",
        0,
      );
      if (uploadError || !url) {
        return { error: uploadError ?? "대표 사진 업로드에 실패했습니다." };
      }
      nextPhotoUrl = url;
    }

    const mergedMatItems = [
      ...optionalPhotos.mat.items,
      ...optionalPhotos.facilities.items,
    ];
    const mergedPendingFiles = {
      ...optionalPendingFiles,
      mat: [
        ...optionalPendingFiles.mat,
        ...optionalPendingFiles.facilities,
      ],
      facilities: [] as { file: File; caption: string }[],
    };

    const existingOptional = {
      mat: mergedMatItems,
      facilities: [] as typeof mergedMatItems,
      exterior: optionalPhotos.exterior.items,
      parking: optionalPhotos.parking.items,
    };

    const { photos, error: optionalError } = await uploadOptionalGymPhotos(
      ownerId,
      targetGymId,
      existingOptional,
      mergedPendingFiles,
    );

    if (optionalError) {
      return { error: optionalError };
    }

    return {
      photo_url: nextPhotoUrl,
      mat_photos: photos.mat,
      facility_photos: [],
      exterior_photos: photos.exterior,
      parking_photos: photos.parking,
    };
  }

  function handleClassScheduleChange(entries: ClassScheduleEntry[]) {
    setClassSchedule(entries);

    if (entries.length === 0) {
      setIsOperatingHoursAuto(false);
      return;
    }

    const derived = deriveOperatingHoursFromSchedule(entries);
    if (!derived) return;

    if (isOperatingHoursAuto || !operatingHours.trim()) {
      setOperatingHours(derived);
      setIsOperatingHoursAuto(true);
    }
  }

  function handleOperatingHoursChange(value: string) {
    setOperatingHours(value);
    setIsOperatingHoursAuto(false);
  }

  function handleRecalculateOperatingHours() {
    const derived = deriveOperatingHoursFromSchedule(classSchedule);
    if (!derived) return;
    setOperatingHours(derived);
    setIsOperatingHoursAuto(true);
  }

  function validateForm(): string | null {
    if (!name.trim()) return "체육관 이름을 입력해주세요.";
    if (sport.length === 0) return "종목을 선택해주세요.";
    if (!gymAddress.roadAddress.trim()) return "주소 검색으로 주소를 입력해주세요.";
    if (!gymAddress.region.trim()) return "주소에서 활동 지역을 확인할 수 없습니다. 다시 검색해주세요.";
    if (!photoUrl && !pendingRepresentative) {
      return "대표 단체사진을 등록해주세요.";
    }
    if (!representativeName.trim()) return "담당자 이름을 입력해주세요.";
    if (!representativePhone.trim()) return "담당자 연락처를 입력해주세요.";
    const roleError = validateRepresentativeRole(
      representativeRole,
      representativeRoleCustom,
    );
    if (roleError) return roleError;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userId) return;

    setSaving(true);
    const supabase = createClient();
    const sportValue = sport[0];
    const region = gymAddress.region.trim();
    const address = formatGymAddress(gymAddress);

    const rolePayload = serializeRepresentativeRole(
      representativeRole,
      representativeRoleCustom,
    );

    const gymPayload = {
      name: name.trim(),
      sport: sportValue,
      region,
      address,
      representative_name: representativeName.trim(),
      representative_phone: normalizePhone(representativePhone),
      ...rolePayload,
      description: null,
      phone: phone.trim() ? normalizePhone(phone) : null,
      instagram_url: instagramUrl.trim() || null,
      homepage_url: homepageUrl.trim() || null,
      class_schedule: serializeClassSchedule(classSchedule),
      operating_hours: operatingHours.trim() || null,
      closed_days: closedDays.trim() || null,
      facilities: serializeGymFacilities(facilityFields),
      facility_notes: facilityFields.notes.trim() || null,
      first_visit_welcome: null,
      walk_in_visits: null,
      gi_rental: null,
      visit_details: null,
      preparation_guide: null,
      training_styles: [],
      gym_tags: [],
      is_public: visibility === "public",
    };

    if (isEdit && gymId) {
      const photoPayload = await buildPhotoPayload(gymId, userId);
      if ("error" in photoPayload) {
        setSaving(false);
        setError(photoPayload.error ?? "사진 업로드에 실패했습니다.");
        return;
      }

      const { error: updateError } = await supabase
        .from("gyms")
        .update({ ...gymPayload, ...photoPayload })
        .eq("id", gymId);

      setSaving(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/host/gyms/${gymId}`);
      router.refresh();
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("gyms")
      .insert({ owner_id: userId, ...gymPayload, photo_url: null })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setSaving(false);
      setError(insertError?.message ?? "체육관 등록에 실패했습니다.");
      return;
    }

    const photoPayload = await buildPhotoPayload(inserted.id, userId);
    if ("error" in photoPayload) {
      setSaving(false);
      setError(photoPayload.error ?? "사진 업로드에 실패했습니다.");
      return;
    }

    const { error: photoError } = await supabase
      .from("gyms")
      .update(photoPayload)
      .eq("id", inserted.id);

    setSaving(false);

    if (photoError) {
      setError(photoError.message);
      return;
    }

    await supabase
      .from("profiles")
      .update({ experience: "지도자", pending_gym_info: null })
      .eq("id", userId);

    router.push(`/gym/${inserted.id}/edit`);
    router.refresh();
  }

  async function handleDelete() {
    if (!gymId) return;

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const today = getTodayDateString();
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .gte("event_date", today);

    if ((count ?? 0) > 0) {
      setDeleting(false);
      setError("운영 중인 일정이 있어 체육관을 삭제할 수 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      "체육관을 삭제합니다. 등록된 과거 일정도 함께 삭제됩니다. 계속하시겠습니까?",
    );
    if (!confirmed) {
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("gyms")
      .delete()
      .eq("id", gymId);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/my/profile");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">불러오는 중...</p>;
  }

  return (
    <>
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {pendingPrefillApplied && !isEdit && (
        <p className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          가입 시 입력한 체육관 정보가 자동으로 채워졌습니다. 확인 후 등록을
          완료해주세요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <GymProfileCompletionBar completion={profileCompletion} />

        <SignupSection title="체육관 · 담당자">
          <SignupField label="체육관 이름" required>
            <SignupInput
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <hr className="border-zinc-100" />

          <SignupField label="담당자 이름" required>
            <SignupInput
              required
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              autoComplete="name"
            />
          </SignupField>

          <RepresentativeRoleFields
            role={representativeRole}
            onRoleChange={setRepresentativeRole}
            customRole={representativeRoleCustom}
            onCustomRoleChange={setRepresentativeRoleCustom}
          />

          <SignupField
            label="담당자 연락처"
            hint="본인 확인용 · 예정 참가자에게 공개되지 않습니다"
            required
          >
            <SignupInput
              type="tel"
              required
              value={representativePhone}
              onChange={(e) =>
                setRepresentativePhone(formatPhoneInput(e.target.value))
              }
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </SignupField>
        </SignupSection>

        <GymFormPreviewPanel
          name={name}
          sport={sport[0] ?? "유도"}
          region={gymAddress.region}
          address={formatGymAddress(gymAddress)}
          phone={phone}
          instagramUrl={instagramUrl}
          homepageUrl={homepageUrl}
          classSchedule={classSchedule}
          operatingHours={operatingHours}
          closedDays={closedDays}
          facilityFields={facilityFields}
          representativePreview={representativePreview}
          photoUrl={photoUrl}
          optionalPhotos={optionalPhotos}
        />

        <SignupSection title="사진">
          <GymPhotoCategoriesInput
            representativePreview={representativePreview}
            hasRepresentative={!!(photoUrl || pendingRepresentative)}
            onRepresentativeSelect={handleRepresentativeSelect}
            optional={optionalPhotos}
            onOptionalAdd={handleOptionalAdd}
            onOptionalRemoveItem={handleOptionalRemoveItem}
            onOptionalRemovePending={handleOptionalRemovePending}
            onOptionalCaptionChange={handleOptionalCaptionChange}
          />
        </SignupSection>

        <GymFormGroup title="운영 · 시설">
          <GymFormBlock
            title="수업 시간표"
            hint="입력하면 운영 시간이 자동으로 계산됩니다"
          >
            <ClassScheduleInput
              value={classSchedule}
              onChange={handleClassScheduleChange}
            />
          </GymFormBlock>

          <GymFormBlock
            title="운영 시간"
            hint={
              isOperatingHoursAuto && classSchedule.length > 0
                ? "수업 시간표에서 자동 입력 · 직접 수정 가능"
                : "수업 시간표를 입력하면 자동으로 채워집니다"
            }
          >
            <div className="flex flex-col gap-3">
              <SignupInput
                value={operatingHours}
                onChange={(e) => handleOperatingHoursChange(e.target.value)}
                placeholder="예: 평일 06:00–22:00, 주말 09:00–18:00"
              />
              {classSchedule.length > 0 && !isOperatingHoursAuto && (
                <button
                  type="button"
                  onClick={handleRecalculateOperatingHours}
                  className="self-start text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  시간표 기준으로 다시 계산
                </button>
              )}
              <SignupInput
                value={closedDays}
                onChange={(e) => setClosedDays(e.target.value)}
                placeholder="휴무일 · 예: 매월 첫째 주 일요일"
              />
            </div>
          </GymFormBlock>

          <GymFormBlock
            title="시설"
            hint="선택한 시설은 체육관 상세에 표시됩니다"
          >
            <FacilityInput value={facilityFields} onChange={setFacilityFields} />
          </GymFormBlock>
        </GymFormGroup>

        <SignupSection title="예정 참가자용 연락처">
          <p className="mb-3 text-xs text-zinc-500">
            체육관 상세·이벤트 페이지에 표시됩니다.
          </p>
          <SignupField label="체육관 전화번호">
            <SignupInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="010-0000-0000"
              inputMode="tel"
            />
          </SignupField>

          <div className="grid gap-3 sm:grid-cols-2">
            <SignupField label="인스타그램">
              <SignupInput
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="instagram.com/..."
              />
            </SignupField>

            <SignupField label="홈페이지">
              <SignupInput
                type="url"
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                placeholder="https://"
              />
            </SignupField>
          </div>

          <hr className="border-zinc-100" />

          <ToggleGroup
            label="공개 설정"
            options={GYM_VISIBILITY_OPTIONS}
            value={visibility}
            onChange={setVisibility}
          />
          <p className="text-xs text-zinc-500">
            비공개 시 탐색 목록에 노출되지 않습니다.
          </p>
        </SignupSection>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving
            ? isEdit
              ? "저장 중..."
              : "등록 중..."
            : isEdit
              ? "저장"
              : "체육관 등록"}
        </button>
      </form>

      {isEdit && gymId && (
        <div className="mt-8 border-t border-zinc-200 pt-6">
          <h2 className="text-sm font-semibold text-zinc-900">체육관 삭제</h2>
          <p className="mt-2 text-sm text-zinc-600">
            운영 중인 일정이 없을 때만 삭제할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-4 w-full rounded-lg border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "체육관 삭제"}
          </button>
        </div>
      )}
    </>
  );
}
