import type { EventType } from "@/lib/constants/event-types";
import { formatEventListDate } from "@/lib/utils/date";

export type ProfileFeedKind = "participate" | "operate" | "gym_join" | "photo";

export type ProfileFeedCategory = "event" | "competition" | "photo";

export type ProfileFeedItem = {
  id: string;
  kind: ProfileFeedKind;
  category: ProfileFeedCategory;
  emoji: string;
  dateLabel: string;
  title: string;
  sortKey: string;
  eventType?: EventType | null;
  photoUrls?: string[];
};

export function buildPhotoFeedItem(input: {
  id: string;
  createdAt: string;
  caption: string | null;
  photoUrls: string[];
}): ProfileFeedItem {
  const dateKey = input.createdAt.slice(0, 10);
  const count = input.photoUrls.length;
  return {
    id: input.id,
    kind: "photo",
    category: "photo",
    emoji: "📷",
    dateLabel: formatEventListDate(dateKey),
    title:
      input.caption?.trim() ||
      (count > 1 ? `운동 사진 ${count}장` : "운동 사진"),
    sortKey: dateKey,
    photoUrls: input.photoUrls,
  };
}

export function getProfileFeedEmoji(
  kind: ProfileFeedKind,
  eventType?: string | null,
): string {
  if (kind === "operate") return "🏠";
  if (kind === "gym_join") return "🏠";
  if (eventType === "seminar") return "🎓";
  if (eventType === "competition") return "🥇";
  return "🥋";
}

export function getProfileFeedCategory(
  eventType?: string | null,
): ProfileFeedCategory {
  return eventType === "competition" ? "competition" : "event";
}

export function formatProfileFeedTitle(
  name: string,
  kind: ProfileFeedKind,
): string {
  const trimmed = name.trim();
  if (kind === "operate") return `${trimmed} 운영`;
  if (kind === "gym_join") return `${trimmed} 등록`;
  return `${trimmed} 참가`;
}

export function buildProfileFeedItem(input: {
  kind: ProfileFeedKind;
  eventDate: string;
  name: string;
  eventType?: string | null;
}): ProfileFeedItem {
  const eventType = (input.eventType ?? "open_mat") as EventType;
  return {
    id: `${input.kind}-${input.eventDate}-${input.name}`,
    kind: input.kind,
    category: getProfileFeedCategory(input.eventType),
    emoji: getProfileFeedEmoji(input.kind, input.eventType),
    dateLabel: formatEventListDate(input.eventDate),
    title: formatProfileFeedTitle(input.name, input.kind),
    sortKey: input.eventDate,
    eventType: input.kind === "gym_join" ? null : eventType,
  };
}

export function filterProfileFeedItems(
  items: ProfileFeedItem[],
  tab: "all" | "photo" | "event" | "competition",
): ProfileFeedItem[] {
  if (tab === "all") return items;
  if (tab === "photo") {
    return items.filter((item) => item.kind === "photo");
  }
  if (tab === "competition") {
    return items.filter((item) => item.category === "competition");
  }
  return items.filter(
    (item) => item.category === "event" && item.kind !== "photo",
  );
}
