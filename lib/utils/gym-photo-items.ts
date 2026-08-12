import type { GymOptionalPhotoCategory } from "@/lib/constants/gym-photos";

export type GymPhotoItem = {
  url: string;
  caption: string;
};

export function isValidPhotoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "[object Object]") return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:image/")
  );
}

function parsePhotoEntry(entry: unknown): GymPhotoItem | null {
  if (typeof entry === "string" && entry.trim()) {
    const trimmed = entry.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as {
          url?: unknown;
          caption?: unknown;
        };
        const url = String(parsed.url ?? "").trim();
        if (!isValidPhotoUrl(url)) return null;
        return {
          url,
          caption: String(parsed.caption ?? "").trim(),
        };
      } catch {
        // fall through
      }
    }

    if (!isValidPhotoUrl(trimmed)) return null;
    return { url: trimmed, caption: "" };
  }

  if (entry && typeof entry === "object" && "url" in entry) {
    const url = String((entry as { url: unknown }).url ?? "").trim();
    if (!isValidPhotoUrl(url)) return null;

    return {
      url,
      caption: String((entry as { caption?: unknown }).caption ?? "").trim(),
    };
  }

  return null;
}

export function parseGymPhotoItems(value: unknown): GymPhotoItem[] {
  if (!Array.isArray(value)) return [];

  const items: GymPhotoItem[] = [];

  for (const entry of value) {
    const parsed = parsePhotoEntry(entry);
    if (parsed) items.push(parsed);
  }

  return items;
}

export function gymPhotoItemsToUrls(items: GymPhotoItem[]): string[] {
  return items.map((item) => item.url);
}

export type OptionalCategoryPhotoState = {
  items: GymPhotoItem[];
  pendingPreviews: string[];
  pendingCaptions: string[];
};

export function createEmptyOptionalCategoryPhotos(): Record<
  GymOptionalPhotoCategory,
  OptionalCategoryPhotoState
> {
  return {
    mat: { items: [], pendingPreviews: [], pendingCaptions: [] },
    facilities: { items: [], pendingPreviews: [], pendingCaptions: [] },
    exterior: { items: [], pendingPreviews: [], pendingCaptions: [] },
    parking: { items: [], pendingPreviews: [], pendingCaptions: [] },
  };
}

export function getOptionalPhotoDisplayLabel(
  caption: string,
  fallback: string,
): string {
  const trimmed = caption.trim();
  return trimmed || fallback;
}

export function countOptionalPhotos(
  photos: OptionalCategoryPhotoState,
): number {
  return photos.items.length + photos.pendingPreviews.length;
}
