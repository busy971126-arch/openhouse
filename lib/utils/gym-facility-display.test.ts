import { describe, expect, it } from "vitest";
import { sortFacilitiesForDisplay } from "./gym-facility-display";

describe("sortFacilitiesForDisplay", () => {
  it("prioritizes parking and shower over wifi", () => {
    const sorted = sortFacilitiesForDisplay([
      "Wi-Fi",
      "샤워실",
      "주차:무료",
    ]);
    expect(sorted[0]).toBe("주차 무료");
    expect(sorted[1]).toBe("샤워실");
    expect(sorted[2]).toBe("Wi-Fi");
  });
});
