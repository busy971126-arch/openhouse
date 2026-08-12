import { describe, expect, it } from "vitest";
import {
  formatGymOperatorProfileSubtitle,
  formatHostIdentitySubtitle,
  formatRepresentativeRoleLabel,
  validateRepresentativeRole,
} from "./gym-representative";

describe("formatRepresentativeRoleLabel", () => {
  it("returns preset role labels", () => {
    expect(formatRepresentativeRoleLabel("감독", null)).toBe("감독");
    expect(formatRepresentativeRoleLabel("관장", null)).toBe("관장");
  });

  it("returns custom label for 기타", () => {
    expect(formatRepresentativeRoleLabel("기타", "헤드코치")).toBe("헤드코치");
  });
});

describe("formatHostIdentitySubtitle", () => {
  it("combines role and host label", () => {
    expect(formatHostIdentitySubtitle("관장", null)).toBe(
      "관장 · OpenHouse 호스트",
    );
  });
});

describe("formatGymOperatorProfileSubtitle", () => {
  it("combines role and operator label", () => {
    expect(formatGymOperatorProfileSubtitle("사범", null)).toBe(
      "사범 · 운영자",
    );
  });

  it("falls back to operator only", () => {
    expect(formatGymOperatorProfileSubtitle(null, null)).toBe("운영자");
  });
});

describe("validateRepresentativeRole", () => {
  it("requires custom text for 기타", () => {
    expect(validateRepresentativeRole("기타", "")).toBe(
      "직책을 직접 입력해주세요.",
    );
    expect(validateRepresentativeRole("기타", "팀장")).toBeNull();
  });
});
