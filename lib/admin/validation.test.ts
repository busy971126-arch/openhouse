import { describe, expect, it } from "vitest";
import {
  ADMIN_REPLY_MAX_LENGTH,
  parseInquiryAdminPatch,
  parseReportAdminPatch,
  resolvedAtForReportStatus,
} from "@/lib/admin/validation";

const current = { status: "open", adminReply: null };

describe("parseInquiryAdminPatch", () => {
  it("rejects a status outside the allowlist with a 400-style error", () => {
    const parsed = parseInquiryAdminPatch({ status: "deleted" }, current);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe("올바른 상태가 아닙니다.");
    }
  });

  it("rejects a reply longer than the max length", () => {
    const parsed = parseInquiryAdminPatch(
      { adminReply: "가".repeat(ADMIN_REPLY_MAX_LENGTH + 1) },
      current,
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe("답변이 너무 깁니다.");
    }
  });

  it("rejects a non-string reply", () => {
    const parsed = parseInquiryAdminPatch({ adminReply: 12 }, current);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe("답변 형식이 올바르지 않습니다.");
    }
  });

  it("accepts a reply at the max length", () => {
    const parsed = parseInquiryAdminPatch(
      { adminReply: "가".repeat(ADMIN_REPLY_MAX_LENGTH) },
      current,
    );
    expect(parsed.ok).toBe(true);
  });
});

describe("parseReportAdminPatch", () => {
  it("rejects a status outside the allowlist", () => {
    const parsed = parseReportAdminPatch({ status: "banned" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe("올바른 상태가 아닙니다.");
    }
  });

  it("clears resolved_at when moving a resolved report to reviewing", () => {
    const parsed = parseReportAdminPatch({ status: "reviewing" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.status).toBe("reviewing");
      expect(parsed.resolvedAt).toBeNull();
    }
  });

  it("sets resolved_at when resolving", () => {
    const parsed = parseReportAdminPatch({ status: "resolved" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.resolvedAt).not.toBeNull();
    }
  });
});

describe("resolvedAtForReportStatus", () => {
  it("returns null for reviewing", () => {
    expect(resolvedAtForReportStatus("reviewing")).toBeNull();
  });
});
