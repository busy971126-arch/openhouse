import { describe, expect, it } from "vitest";
import {
  formatRegionFilterLabel,
  findProvinceIdForRegion,
  GYM_REGION_FILTER_OPTIONS,
} from "./region-filter";

describe("region-filter", () => {
  it("includes province-wide and district options", () => {
    expect(GYM_REGION_FILTER_OPTIONS.some((o) => o.value === "경기")).toBe(true);
    expect(GYM_REGION_FILTER_OPTIONS.some((o) => o.value === "경기 부천")).toBe(
      true,
    );
  });

  it("formats region filter labels", () => {
    expect(formatRegionFilterLabel("경기")).toBe("경기 전체");
    expect(formatRegionFilterLabel("경기 부천")).toBe("경기 부천");
    expect(formatRegionFilterLabel("서울 강남")).toBe("서울 강남");
  });

  it("finds province id for stored gym region", () => {
    expect(findProvinceIdForRegion("경기 부천")).toBe("gyeonggi");
    expect(findProvinceIdForRegion("경기")).toBe("gyeonggi");
    expect(findProvinceIdForRegion("서울")).toBe("seoul");
  });
});
