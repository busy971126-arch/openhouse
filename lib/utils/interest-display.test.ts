import { describe, expect, it } from "vitest";
import {
  formatInterestEventStatusLine,
  getInterestToastMessage,
} from "./interest-display";

describe("interest-display", () => {
  it("formats interest event status line", () => {
    expect(
      formatInterestEventStatusLine("2026-08-24", "open_mat", "recruiting"),
    ).toContain("신청 가능");
  });

  it("returns gym toast messages", () => {
    expect(getInterestToastMessage("gym", true)).toBe(
      "관심 체육관에 등록했어요.",
    );
    expect(getInterestToastMessage("gym", false)).toBe(
      "관심 체육관에서 삭제했어요.",
    );
  });

  it("returns event toast messages", () => {
    expect(getInterestToastMessage("event", true)).toBe(
      "관심 이벤트에 등록했어요.",
    );
  });
});
