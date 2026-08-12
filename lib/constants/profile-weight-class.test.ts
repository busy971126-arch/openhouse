import { describe, expect, it } from "vitest";
import {
  FEMALE_WEIGHT_CLASS_OPTIONS,
  getWeightClassOptionsForGender,
  isWeightClassValidForGender,
  MALE_WEIGHT_CLASS_OPTIONS,
} from "@/lib/constants/profile";

describe("weight class by gender", () => {
  it("returns male judo weight classes", () => {
    expect(getWeightClassOptionsForGender("남성")).toEqual([
      ...MALE_WEIGHT_CLASS_OPTIONS,
    ]);
    expect(getWeightClassOptionsForGender("남성").map((o) => o.value)).toContain(
      "-73kg",
    );
  });

  it("returns female judo weight classes", () => {
    expect(getWeightClassOptionsForGender("여성")).toEqual([
      ...FEMALE_WEIGHT_CLASS_OPTIONS,
    ]);
    expect(getWeightClassOptionsForGender("여성").map((o) => o.value)).toContain(
      "-63kg",
    );
    expect(
      getWeightClassOptionsForGender("여성").map((o) => o.value),
    ).not.toContain("-73kg");
  });

  it("validates weight class against gender", () => {
    expect(isWeightClassValidForGender("-73kg", "남성")).toBe(true);
    expect(isWeightClassValidForGender("-73kg", "여성")).toBe(false);
    expect(isWeightClassValidForGender("-63kg", "여성")).toBe(true);
  });
});
