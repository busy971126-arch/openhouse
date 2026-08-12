import { describe, expect, it } from "vitest";
import { sanitizeSignupMetadata } from "@/lib/utils/auth-errors";

describe("sanitizeSignupMetadata", () => {
  it("removes null and empty string fields", () => {
    const result = sanitizeSignupMetadata({
      display_name: "홍길동",
      nickname: "유도곰",
      weight_class: null,
      phone: "",
      regions: ["서울"],
    });

    expect(result).toEqual({
      display_name: "홍길동",
      nickname: "유도곰",
      regions: ["서울"],
    });
  });
});
