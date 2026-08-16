import {
  DEFAULT_PROFILE_VISIBILITY,
  type ProfileVisibilityField,
  type ProfileVisibilityLevel,
  type ProfileVisibilitySettings,
} from "@/lib/constants/profile-visibility";

export type ProfileViewContext = "self" | "friend" | "other" | "host";

export function parseProfileVisibilitySettings(
  raw: unknown,
): Record<ProfileVisibilityField, ProfileVisibilityLevel> {
  const merged = { ...DEFAULT_PROFILE_VISIBILITY };

  if (!raw || typeof raw !== "object") {
    return merged;
  }

  const input = raw as Record<string, unknown>;

  for (const field of Object.keys(DEFAULT_PROFILE_VISIBILITY) as ProfileVisibilityField[]) {
    const value = input[field];
    if (value === "public" || value === "friends" || value === "private") {
      merged[field] = value;
    }
  }

  return merged;
}

export function getProfileViewContext(options: {
  isSelf: boolean;
  isFriend: boolean;
  isEventHost?: boolean;
}): ProfileViewContext {
  if (options.isSelf) return "self";
  if (options.isEventHost) return "host";
  if (options.isFriend) return "friend";
  return "other";
}

export function canViewProfileField(
  field: ProfileVisibilityField,
  settings: ProfileVisibilitySettings | null | undefined,
  context: ProfileViewContext,
): boolean {
  if (context === "self" || context === "host") return true;

  const level = parseProfileVisibilitySettings(settings)[field];
  if (level === "public") return true;
  if (level === "friends" && context === "friend") return true;
  return false;
}

export function maskProfileValue<T>(
  value: T | null | undefined,
  field: ProfileVisibilityField,
  settings: ProfileVisibilitySettings | null | undefined,
  context: ProfileViewContext,
): T | null {
  if (value == null || value === "") return null;
  if (!canViewProfileField(field, settings, context)) return null;
  return value;
}
