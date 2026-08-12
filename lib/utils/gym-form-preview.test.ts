import { describe, expect, it } from "vitest";
import { buildGymPreviewFromForm, GYM_PREVIEW_ID } from "./gym-form-preview";

describe("buildGymPreviewFromForm", () => {
  it("builds preview gym from form defaults", () => {
    const gym = buildGymPreviewFromForm({
      name: "부천 유도장",
      sport: "유도",
      region: "경기",
      address: "경기 부천시",
      phone: "010-1234-5678",
      instagramUrl: "",
      homepageUrl: "",
      classSchedule: [],
      operatingHours: "평일 18:00~22:00",
      closedDays: "일요일",
      facilityFields: { selected: ["샤워실"], parkingType: null, notes: "" },
      representativePreview: "https://example.com/photo.jpg",
      photoUrl: "",
      optionalPhotos: {
        mat: { items: [], pendingPreviews: [], pendingCaptions: [] },
        facilities: { items: [], pendingPreviews: [], pendingCaptions: [] },
        exterior: { items: [], pendingPreviews: [], pendingCaptions: [] },
        parking: { items: [], pendingPreviews: [], pendingCaptions: [] },
      },
    });

    expect(gym.id).toBe(GYM_PREVIEW_ID);
    expect(gym.name).toBe("부천 유도장");
    expect(gym.photo_url).toBe("https://example.com/photo.jpg");
    expect(gym.facilities).toContain("샤워실");
    expect(gym.description).toBeNull();
  });
});
