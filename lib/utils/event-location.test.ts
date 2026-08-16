import { describe, expect, it } from "vitest";
import {
  eventLocationToPayload,
  getEventDisplayAddress,
  getEventLocationDefaults,
  validateEventLocation,
} from "@/lib/utils/event-location";
import { createEmptyGymAddress } from "@/lib/utils/address-region";

describe("event-location", () => {
  it("prefers event address over gym when editing", () => {
    const defaults = getEventLocationDefaults(
      { address: "서울 강남구 이벤트로 1", region: "서울 강남" },
      { address: "경기 부천시 체육관로 2", region: "경기 부천" },
    );

    expect(defaults.roadAddress).toBe("서울 강남구 이벤트로 1");
    expect(defaults.region).toBe("서울 강남");
  });

  it("falls back to gym address on create", () => {
    const defaults = getEventLocationDefaults(null, {
      address: "경기 부천시 체육관로 2",
      region: "경기 부천",
    });

    expect(defaults.roadAddress).toBe("경기 부천시 체육관로 2");
    expect(defaults.region).toBe("경기 부천");
  });

  it("validates required address fields", () => {
    expect(validateEventLocation(createEmptyGymAddress())).toBe(
      "장소 주소를 입력해주세요.",
    );
  });

  it("maps address payload to events columns", () => {
    expect(
      eventLocationToPayload({
        zonecode: "12345",
        roadAddress: "서울 강남구 테헤란로 1",
        addressDetail: "3층",
        region: "서울 강남",
      }),
    ).toEqual({
      region: "서울 강남",
      address: "서울 강남구 테헤란로 1 3층",
    });
  });

  it("displays event address before gym fallback", () => {
    expect(
      getEventDisplayAddress(
        { address: "서울 이벤트 주소", region: "서울" },
        { address: "경기 체육관 주소", region: "경기" },
      ),
    ).toBe("서울 이벤트 주소");
  });
});
