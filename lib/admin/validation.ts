import {
  parseInquiryStatus,
  parseReportStatus,
  resolveInquiryReplyStatus,
  type InquiryAdminStatus,
  type ReportAdminStatus,
} from "@/lib/utils/admin";

export const ADMIN_REPLY_MAX_LENGTH = 5000;
export const ADMIN_GENERIC_ERROR = "처리하지 못했습니다.";

export function resolvedAtForReportStatus(
  status: ReportAdminStatus,
  now = new Date(),
): string | null {
  return status === "resolved" ? now.toISOString() : null;
}

export function parseInquiryAdminPatch(
  body: unknown,
  current: { status: string; adminReply: string | null },
):
  | { ok: true; status: InquiryAdminStatus; adminReply: string | null }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "올바른 요청이 아닙니다." };
  }

  const payload = body as Record<string, unknown>;

  if ("status" in payload) {
    const parsed = parseInquiryStatus(payload.status);
    if (!parsed) {
      return { ok: false, error: "올바른 상태가 아닙니다." };
    }
  }

  if ("adminReply" in payload && typeof payload.adminReply !== "string") {
    return { ok: false, error: "답변 형식이 올바르지 않습니다." };
  }

  const replySource =
    typeof payload.adminReply === "string"
      ? payload.adminReply
      : (current.adminReply ?? "");

  if (replySource.length > ADMIN_REPLY_MAX_LENGTH) {
    return { ok: false, error: "답변이 너무 깁니다." };
  }

  const reply = replySource.trim();
  const nextStatus = resolveInquiryReplyStatus(
    current.status,
    "status" in payload ? parseInquiryStatus(payload.status) : null,
    reply,
  );

  return {
    ok: true,
    status: nextStatus,
    adminReply: reply || null,
  };
}

export function parseReportAdminPatch(
  body: unknown,
):
  | { ok: true; status: ReportAdminStatus; resolvedAt: string | null }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "올바른 요청이 아닙니다." };
  }

  const payload = body as Record<string, unknown>;
  if (!("status" in payload)) {
    return { ok: false, error: "올바른 상태가 아닙니다." };
  }

  const status = parseReportStatus(payload.status);
  if (!status) {
    return { ok: false, error: "올바른 상태가 아닙니다." };
  }

  return {
    ok: true,
    status,
    resolvedAt: resolvedAtForReportStatus(status),
  };
}
