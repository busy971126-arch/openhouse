import { describe, expect, it } from "vitest";
import { formatPhotoCategoryStatus } from "@/lib/constants/gym-photos";

describe("formatPhotoCategoryStatus", () => {
  it("shows required status", () => {
    expect(formatPhotoCategoryStatus(0, true)).toBe("필수 · 미등록");
    expect(formatPhotoCategoryStatus(1, true)).toBe("✅ 등록 완료");
  });

  it("shows optional status", () => {
    expect(formatPhotoCategoryStatus(0)).toBe("미등록");
    expect(formatPhotoCategoryStatus(2)).toBe("📷 사진 2장");
  });
});
