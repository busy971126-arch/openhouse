import { describe, expect, it } from "vitest";
import {
  buildPendingGymInfo,
  getPendingGymFormDefaults,
  parsePendingGymInfo,
} from "@/lib/utils/pending-gym-info";

describe("pending-gym-info", () => {
  it("builds payload from signup gym input", () => {
    expect(
      buildPendingGymInfo({
        name: " openhouse judo ",
        address: "경기 부천",
        region: "부천",
        representativeName: "홍길동",
        representativePhone: "010-1234-5678",
        representativeRole: "관장",
      }),
    ).toMatchObject({
      name: "openhouse judo",
      address: "경기 부천",
      region: "부천",
      representative_name: "홍길동",
      representative_phone: "010-1234-5678",
    });
  });

  it("parses stored json", () => {
    expect(
      parsePendingGymInfo({
        name: "테스트 도장",
        address: "서울",
        region: "강남",
        representative_name: "김관장",
        representative_phone: "01011112222",
      })?.name,
    ).toBe("테스트 도장");
  });

  it("returns null for invalid payload", () => {
    expect(parsePendingGymInfo(null)).toBeNull();
    expect(parsePendingGymInfo({ name: "  " })).toBeNull();
  });

  it("maps pending info to gym form defaults", () => {
    const pending = parsePendingGymInfo({
      name: "테스트 도장",
      address: "경기 부천시 원미구",
      region: "경기 부천",
      representative_name: "김관장",
      representative_phone: "010-1234-5678",
      representative_role: "관장",
    });

    expect(getPendingGymFormDefaults(pending!, { display_name: "프로필명" }))
      .toMatchObject({
        name: "테스트 도장",
        representativeName: "김관장",
        phone: "010-1234-5678",
        representativeRole: "관장",
        gymAddress: {
          roadAddress: "경기 부천시 원미구",
          region: "경기 부천",
        },
      });
  });
});
