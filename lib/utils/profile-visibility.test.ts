import { describe, expect, it } from "vitest";
import {
  canViewProfileField,
  getProfileViewContext,
  maskProfileValue,
  parseProfileVisibilitySettings,
} from "@/lib/utils/profile-visibility";

describe("parseProfileVisibilitySettings", () => {
  it("merges defaults for missing keys", () => {
    expect(parseProfileVisibilitySettings({ weight_class: "friends" })).toEqual({
      ...parseProfileVisibilitySettings(null),
      weight_class: "friends",
    });
  });

  it("ignores invalid values", () => {
    expect(
      parseProfileVisibilitySettings({ weight_class: "invalid" }).weight_class,
    ).toBe("public");
  });
});

describe("canViewProfileField", () => {
  const settings = { weight_class: "friends" as const };

  it("allows self and host to see everything", () => {
    expect(canViewProfileField("weight_class", settings, "self")).toBe(true);
    expect(canViewProfileField("weight_class", settings, "host")).toBe(true);
  });

  it("respects friends-only visibility", () => {
    expect(canViewProfileField("weight_class", settings, "friend")).toBe(true);
    expect(canViewProfileField("weight_class", settings, "other")).toBe(false);
  });

  it("defaults phone to private for others", () => {
    expect(canViewProfileField("phone", null, "other")).toBe(false);
    expect(canViewProfileField("phone", null, "friend")).toBe(false);
  });
});

describe("getProfileViewContext", () => {
  it("prioritizes self over friend", () => {
    expect(getProfileViewContext({ isSelf: true, isFriend: true })).toBe("self");
  });
});

describe("maskProfileValue", () => {
  it("returns null when field is hidden", () => {
    expect(
      maskProfileValue("라이트", "weight_class", { weight_class: "private" }, "other"),
    ).toBeNull();
  });
});
