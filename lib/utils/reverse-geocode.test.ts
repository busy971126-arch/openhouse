import { describe, expect, it } from "vitest";
import {
  regionFromKakaoDocument,
  regionFromNominatimAddress,
} from "./reverse-geocode";

describe("reverse-geocode", () => {
  it("maps Kakao region document to OpenHouse region", () => {
    expect(
      regionFromKakaoDocument({
        region_1depth_name: "경기도",
        region_2depth_name: "부천시",
      }),
    ).toBe("경기 부천");
  });

  it("maps Nominatim address to OpenHouse region", () => {
    expect(
      regionFromNominatimAddress({
        state: "경기도",
        city: "부천시",
      }),
    ).toBe("경기 부천");
  });
});
