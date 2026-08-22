import { describe, expect, it } from "vitest";
import {
  isAdminPath,
  parseEventAdminStatus,
  parseInquiryStatus,
  parseReportStatus,
  resolveInquiryReplyStatus,
  formatAdminUserLabel,
  sanitizeAdminSearch,
} from "@/lib/utils/admin";

describe("admin helpers", () => {
  it("detects admin routes", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/inquiries")).toBe(true);
    expect(isAdminPath("/my")).toBe(false);
    expect(isAdminPath("/adminish")).toBe(false);
  });

  it("parses allowed statuses only", () => {
    expect(parseInquiryStatus("open")).toBe("open");
    expect(parseInquiryStatus("deleted")).toBeNull();
    expect(parseReportStatus("reviewing")).toBe("reviewing");
    expect(parseReportStatus("banned")).toBeNull();
    expect(parseEventAdminStatus("draft")).toBe("draft");
    expect(parseEventAdminStatus("archived")).toBeNull();
  });

  it("keeps inquiry reply from looking like empty when a reply is saved", () => {
    expect(resolveInquiryReplyStatus("open", null, "확인했습니다.")).toBe(
      "answered",
    );
    expect(resolveInquiryReplyStatus("open", "closed", "확인했습니다.")).toBe(
      "closed",
    );
    expect(resolveInquiryReplyStatus("answered", null, "")).toBe("answered");
  });

  it("formats user labels without falling back to email or phone", () => {
    expect(formatAdminUserLabel("nick", "실명")).toBe("nick");
    expect(formatAdminUserLabel(null, "실명")).toBe("실명");
    expect(formatAdminUserLabel(null, null)).toBe("이름 없음");
  });

  it("strips ilike metacharacters from search", () => {
    expect(sanitizeAdminSearch("김%,_이")).toBe("김 이");
  });
});
