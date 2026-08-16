export type ProfileVisibilityLevel = "public" | "friends" | "private";

export type ProfileVisibilityField =
  | "weight_class"
  | "experience"
  | "gym_affiliation"
  | "regions"
  | "bio"
  | "phone"
  | "parent_phone"
  | "preferred_sports";

export type ProfileVisibilitySettings = Partial<
  Record<ProfileVisibilityField, ProfileVisibilityLevel>
>;

export const PROFILE_VISIBILITY_LEVEL_OPTIONS = [
  { value: "public" as const, label: "전체공개" },
  { value: "friends" as const, label: "운동 친구만" },
  { value: "private" as const, label: "비공개" },
];

export const DEFAULT_PROFILE_VISIBILITY: Record<
  ProfileVisibilityField,
  ProfileVisibilityLevel
> = {
  weight_class: "public",
  experience: "public",
  gym_affiliation: "public",
  regions: "public",
  bio: "public",
  phone: "private",
  parent_phone: "private",
  preferred_sports: "public",
};

export const PROFILE_VISIBILITY_FIELD_CONFIGS: {
  field: ProfileVisibilityField;
  label: string;
  description?: string;
}[] = [
  { field: "preferred_sports", label: "종목" },
  { field: "weight_class", label: "체급" },
  { field: "experience", label: "수련 경력·배경" },
  { field: "gym_affiliation", label: "소속 체육관" },
  { field: "regions", label: "활동 지역" },
  { field: "bio", label: "소개" },
  {
    field: "phone",
    label: "연락처",
    description: "다른 회원에게는 기본적으로 표시되지 않습니다.",
  },
  {
    field: "parent_phone",
    label: "보호자 연락처",
    description: "미성년자 보호자 연락처입니다.",
  },
];
