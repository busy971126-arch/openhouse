import { describe, expect, it } from "vitest";
import { buildHostParticipantsUrl } from "@/lib/utils/host-participants-url";

describe("host-participants-url", () => {
  it("builds host participants url with gym and event", () => {
    expect(
      buildHostParticipantsUrl("gym-1", "event-1"),
    ).toBe("/host/participants?gym=gym-1&event=event-1");
  });

  it("builds host participants url with gym only", () => {
    expect(buildHostParticipantsUrl("gym-1")).toBe("/host/participants?gym=gym-1");
  });
});
