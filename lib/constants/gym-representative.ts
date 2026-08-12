export const GYM_REPRESENTATIVE_ROLE_OTHER = "기타";

export const GYM_REPRESENTATIVE_ROLE_OPTIONS = [
  { value: "관장", label: "관장" },
  { value: "사범", label: "사범" },
  { value: "코치", label: "코치" },
  { value: "감독", label: "감독" },
  { value: "운영자", label: "운영자" },
  { value: GYM_REPRESENTATIVE_ROLE_OTHER, label: "기타 (직접 입력)" },
] as const;

export type GymRepresentativeRole =
  (typeof GYM_REPRESENTATIVE_ROLE_OPTIONS)[number]["value"];

const PRESET_ROLES = new Set<string>(
  GYM_REPRESENTATIVE_ROLE_OPTIONS.map((option) => option.value),
);

export function isGymRepresentativeRoleOther(role: string) {
  return role === GYM_REPRESENTATIVE_ROLE_OTHER;
}

/** 화면 표시용 직책 라벨 */
export function formatRepresentativeRoleLabel(
  role: string | null | undefined,
  customRole: string | null | undefined,
): string | null {
  if (!role?.trim()) return null;
  if (isGymRepresentativeRoleOther(role)) {
    return customRole?.trim() || null;
  }
  return role;
}

/** 담당자 직책 · OpenHouse 호스트 (호스트 허브 등) */
export function formatHostIdentitySubtitle(
  role: string | null | undefined,
  customRole: string | null | undefined,
): string | null {
  const roleLabel = formatRepresentativeRoleLabel(role, customRole);
  if (!roleLabel) return "OpenHouse 호스트";
  return `${roleLabel} · OpenHouse 호스트`;
}

/** 내 프로필 — 체육관 직책 · 운영자 */
export function formatGymOperatorProfileSubtitle(
  role: string | null | undefined,
  customRole: string | null | undefined,
): string {
  const roleLabel = formatRepresentativeRoleLabel(role, customRole);
  if (!roleLabel) return "운영자";
  return `${roleLabel} · 운영자`;
}

export function validateRepresentativeRole(
  role: string,
  customRole: string,
): string | null {
  if (!role.trim()) return "담당자 직책을 선택해주세요.";
  if (!PRESET_ROLES.has(role)) return "담당자 직책을 선택해주세요.";
  if (isGymRepresentativeRoleOther(role) && !customRole.trim()) {
    return "직책을 직접 입력해주세요.";
  }
  return null;
}

export function serializeRepresentativeRole(
  role: string,
  customRole: string,
): {
  representative_role: string;
  representative_role_custom: string | null;
} {
  return {
    representative_role: role.trim(),
    representative_role_custom: isGymRepresentativeRoleOther(role)
      ? customRole.trim()
      : null,
  };
}
