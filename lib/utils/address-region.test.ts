import { describe, expect, it } from "vitest";
import {
  deriveRegionFromPostcode,
  formatGymAddress,
  applyPostcodeResult,
  createEmptyGymAddress,
} from "./address-region";

describe("address-region", () => {
  it("derives region from sido and sigungu", () => {
    expect(
      deriveRegionFromPostcode({ sido: "서울특별시", sigungu: "강남구" }),
    ).toBe("서울 강남");
    expect(
      deriveRegionFromPostcode({ sido: "경기도", sigungu: "성남시 분당구" }),
    ).toBe("경기 성남");
  });

  it("formats full address with detail", () => {
    expect(
      formatGymAddress({
        zonecode: "06234",
        roadAddress: "서울 강남구 테헤란로 123",
        addressDetail: "3층",
        region: "서울 강남",
      }),
    ).toBe("서울 강남구 테헤란로 123 3층");
  });

  it("applies postcode result", () => {
    const next = applyPostcodeResult(createEmptyGymAddress(), {
      zonecode: "06234",
      roadAddress: "서울 강남구 테헤란로 123",
      jibunAddress: "",
      sido: "서울특별시",
      sigungu: "강남구",
      bname: "",
      buildingName: "",
    });

    expect(next.region).toBe("서울 강남");
    expect(next.roadAddress).toContain("테헤란로");
  });
});
