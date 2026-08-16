import { describe, expect, it } from "vitest";
import { isEventHost } from "@/lib/utils/event-host";

describe("isEventHost", () => {
  const event = {
    created_by: "creator-id",
    gyms: { owner_id: "owner-id" },
  };

  it("returns false when user is not logged in", () => {
    expect(isEventHost(null, event)).toBe(false);
  });

  it("returns true for event creator", () => {
    expect(isEventHost("creator-id", event)).toBe(true);
  });

  it("returns true for gym owner", () => {
    expect(isEventHost("owner-id", event)).toBe(true);
  });

  it("returns false for other users", () => {
    expect(isEventHost("other-id", event)).toBe(false);
  });
});
