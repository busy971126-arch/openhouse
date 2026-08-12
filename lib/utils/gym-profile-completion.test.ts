import { describe, expect, it } from "vitest";
import { getGymProfileCompletion } from "./gym-profile-completion";

const emptyOptionalPhotos = {
  mat: { items: [], pendingPreviews: [], pendingCaptions: [] },
  facilities: { items: [], pendingPreviews: [], pendingCaptions: [] },
  exterior: { items: [], pendingPreviews: [], pendingCaptions: [] },
  parking: { items: [], pendingPreviews: [], pendingCaptions: [] },
};

const baseInput = {
  facilityFields: { selected: [], parkingType: null, notes: "" },
  operatingHours: "",
  classSchedule: [],
  closedDays: "",
  phone: "",
  instagramUrl: "",
  homepageUrl: "",
  optionalPhotos: emptyOptionalPhotos,
};

describe("getGymProfileCompletion", () => {
  it("counts optional profile fields", () => {
    const result = getGymProfileCompletion(baseInput);
    expect(result.completed).toBe(0);
    expect(result.total).toBe(4);
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(4);
  });

  it("increases when optional fields are filled", () => {
    const completion = getGymProfileCompletion({
      ...baseInput,
      phone: "010-1234-5678",
      operatingHours: "평일 18:00~22:00",
    });

    expect(completion.completed).toBe(2);
    expect(completion.percent).toBe(50);
    expect(completion.missing).toEqual(["운동·시설 사진", "시설 정보"]);
  });
});
