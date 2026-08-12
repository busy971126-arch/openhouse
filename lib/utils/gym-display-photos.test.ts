import { describe, expect, it } from "vitest";
import {
  collectGymDisplayPhotos,
  collectGymPreviewPhotos,
} from "./gym-display-photos";

describe("collectGymDisplayPhotos", () => {
  it("orders representative photo first and uses captions", () => {
    const photos = collectGymDisplayPhotos({
      photo_url: "https://example.com/main.jpg",
      mat_photos: [
        { url: "https://example.com/mat.jpg", caption: "매트 전경" },
      ],
      facility_photos: null,
      exterior_photos: null,
      parking_photos: null,
    });

    expect(photos).toHaveLength(2);
    expect(photos[0]?.url).toBe("https://example.com/main.jpg");
    expect(photos[1]?.label).toBe("매트 전경");
  });
});

describe("collectGymPreviewPhotos", () => {
  it("collects preview photos from form state", () => {
    const photos = collectGymPreviewPhotos("https://example.com/main.jpg", {
      mat: {
        items: [{ url: "https://example.com/mat.jpg", caption: "샤워실" }],
        pendingPreviews: [],
        pendingCaptions: [],
      },
      facilities: {
        items: [],
        pendingPreviews: ["blob:pending"],
        pendingCaptions: ["무료 주차"],
      },
      exterior: { items: [], pendingPreviews: [], pendingCaptions: [] },
      parking: { items: [], pendingPreviews: [], pendingCaptions: [] },
    });

    expect(photos).toHaveLength(3);
    expect(photos[1]?.label).toBe("샤워실");
    expect(photos[2]?.label).toBe("무료 주차");
  });
});
