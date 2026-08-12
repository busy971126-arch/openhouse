import { describe, expect, it } from "vitest";
import {
  buildProfileFeedItem,
  filterProfileFeedItems,
  formatProfileFeedTitle,
  getProfileFeedEmoji,
} from "@/lib/utils/profile-feed";

describe("profile-feed", () => {
  it("uses emoji by activity type", () => {
    expect(getProfileFeedEmoji("participate", "open_mat")).toBe("🥋");
    expect(getProfileFeedEmoji("participate", "seminar")).toBe("🎓");
    expect(getProfileFeedEmoji("participate", "competition")).toBe("🥇");
    expect(getProfileFeedEmoji("operate", "open_mat")).toBe("🏠");
  });

  it("formats feed titles", () => {
    expect(formatProfileFeedTitle("부천 오픈매트", "participate")).toBe(
      "부천 오픈매트 참가",
    );
    expect(formatProfileFeedTitle("OO 세미나", "participate")).toBe(
      "OO 세미나 참가",
    );
    expect(formatProfileFeedTitle("부천 오픈매트", "operate")).toBe(
      "부천 오픈매트 운영",
    );
  });

  it("builds and filters feed items", () => {
    const items = [
      buildProfileFeedItem({
        kind: "participate",
        eventDate: "2026-08-16",
        name: "부천 오픈매트",
        eventType: "open_mat",
      }),
      buildProfileFeedItem({
        kind: "participate",
        eventDate: "2026-08-10",
        name: "서울시장기",
        eventType: "competition",
      }),
    ];

    expect(filterProfileFeedItems(items, "competition")).toHaveLength(1);
    expect(filterProfileFeedItems(items, "photo")).toHaveLength(0);
    expect(
      filterProfileFeedItems(
        [
          ...items,
          {
            id: "photo-1",
            kind: "photo" as const,
            category: "photo" as const,
            emoji: "📷",
            dateLabel: "8/12",
            title: "운동 사진",
            sortKey: "2026-08-12",
            photoUrls: ["https://example.com/a.jpg"],
          },
        ],
        "photo",
      ),
    ).toHaveLength(1);
  });
});
