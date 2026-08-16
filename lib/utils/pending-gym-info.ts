import {
  GYM_REPRESENTATIVE_ROLE_OTHER,
  isGymRepresentativeRoleOther,
  serializeRepresentativeRole,
} from "@/lib/constants/gym-representative";
import {
  gymAddressFromStored,
  type GymAddressValue,
} from "@/lib/utils/address-region";
import { normalizePhone } from "@/lib/utils/phone";

export type PendingGymInfo = {
  name: string;
  address: string;
  region: string;
  representative_name: string;
  representative_phone: string;
  representative_role?: string | null;
  representative_role_custom?: string | null;
};

type SignupGymInput = {
  name?: string;
  address?: string;
  region?: string;
  representativeName?: string;
  representativePhone?: string;
  representativeRole?: string;
  representativeRoleCustom?: string;
};

export function buildPendingGymInfo(
  gym: SignupGymInput | undefined | null,
): PendingGymInfo | null {
  if (!gym) return null;

  const name = gym.name?.trim() ?? "";
  if (!name) return null;

  const rolePayload = serializeRepresentativeRole(
    gym.representativeRole ?? "",
    gym.representativeRoleCustom ?? "",
  );

  return {
    name,
    address: gym.address?.trim() ?? "",
    region: gym.region?.trim() || "미정",
    representative_name: gym.representativeName?.trim() ?? "",
    representative_phone: normalizePhone(gym.representativePhone ?? "") ?? "",
    ...rolePayload,
  };
}

export function parsePendingGymInfo(value: unknown): PendingGymInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return null;

  return {
    name,
    address: typeof record.address === "string" ? record.address : "",
    region: typeof record.region === "string" ? record.region : "미정",
    representative_name:
      typeof record.representative_name === "string"
        ? record.representative_name
        : "",
    representative_phone:
      typeof record.representative_phone === "string"
        ? record.representative_phone
        : "",
    representative_role:
      typeof record.representative_role === "string"
        ? record.representative_role
        : null,
    representative_role_custom:
      typeof record.representative_role_custom === "string"
        ? record.representative_role_custom
        : null,
  };
}

export type PendingGymFormDefaults = {
  name: string;
  gymAddress: GymAddressValue;
  representativeName: string;
  representativePhone: string;
  phone: string;
  representativeRole: string;
  representativeRoleCustom: string;
};

export function getPendingGymFormDefaults(
  pending: PendingGymInfo,
  profile?: { display_name?: string | null; phone?: string | null },
): PendingGymFormDefaults {
  const representativeName =
    pending.representative_name.trim() || profile?.display_name?.trim() || "";
  const phoneRaw =
    pending.representative_phone.trim() || profile?.phone?.trim() || "";

  let representativeRole = "";
  let representativeRoleCustom = "";
  const storedRole = pending.representative_role?.trim();
  if (storedRole) {
    if (isGymRepresentativeRoleOther(storedRole)) {
      representativeRole = GYM_REPRESENTATIVE_ROLE_OTHER;
      representativeRoleCustom = pending.representative_role_custom?.trim() ?? "";
    } else {
      representativeRole = storedRole;
      representativeRoleCustom = pending.representative_role_custom?.trim() ?? "";
    }
  }

  return {
    name: pending.name,
    gymAddress: gymAddressFromStored(pending.address, pending.region),
    representativeName,
    representativePhone: phoneRaw,
    phone: phoneRaw,
    representativeRole,
    representativeRoleCustom,
  };
}
