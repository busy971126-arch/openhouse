import { describe, expect, it } from "vitest";
import {
  getOptionalPhotoDisplayLabel,
  parseGymPhotoItems,
} from "./gym-photo-items";

describe("parseGymPhotoItems", () => {
  it("parses jsonb photo items", () => {
    expect(
      parseGymPhotoItems([
        { url: "https://example.com/a.jpg", caption: "샤워실" },
      ]),
    ).toEqual([{ url: "https://example.com/a.jpg", caption: "샤워실" }]);
  });

  it("supports legacy string urls", () => {
    expect(parseGymPhotoItems(["https://example.com/a.jpg"])).toEqual([
      { url: "https://example.com/a.jpg", caption: "" },
    ]);
  });

  it("skips corrupted object string urls", () => {
    expect(parseGymPhotoItems(["[object Object]"])).toEqual([]);
  });
});

describe("getOptionalPhotoDisplayLabel", () => {
  it("prefers caption over fallback", () => {
    expect(getOptionalPhotoDisplayLabel("무료 주차장", "주차장")).toBe(
      "무료 주차장",
    );
  });

  it("uses fallback when caption is empty", () => {
    expect(getOptionalPhotoDisplayLabel("", "운동 공간")).toBe("운동 공간");
  });
});
