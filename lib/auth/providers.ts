import type { User } from "@supabase/supabase-js";

export type OpenHouseAuthProvider =
  | "email"
  | "kakao"
  | "apple"
  | "google"
  | "unknown";

export function getUserProviders(
  user: Pick<User, "app_metadata" | "identities">,
): Set<string> {
  const providers = new Set<string>();
  const metadataProviders = user.app_metadata?.providers;
  const primaryProvider = user.app_metadata?.provider;

  if (Array.isArray(metadataProviders)) {
    for (const provider of metadataProviders) {
      if (typeof provider === "string" && provider) providers.add(provider);
    }
  }

  if (typeof primaryProvider === "string" && primaryProvider) {
    providers.add(primaryProvider);
  }

  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(identity.provider);
  }

  return providers;
}

export function hasPasswordLogin(
  user: Pick<User, "app_metadata" | "identities">,
): boolean {
  return getUserProviders(user).has("email");
}

export function getPreferredReauthProvider(
  user: Pick<User, "app_metadata" | "identities">,
): OpenHouseAuthProvider {
  const providers = getUserProviders(user);

  if (providers.has("email")) return "email";
  if (providers.has("kakao")) return "kakao";
  if (providers.has("apple")) return "apple";
  if (providers.has("google")) return "google";
  return "unknown";
}
