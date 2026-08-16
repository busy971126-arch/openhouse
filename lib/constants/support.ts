export const REPORT_CATEGORY_OPTIONS = [
  { value: "no_show", label: "노쇼" },
  { value: "abuse", label: "폭언·욕설" },
  { value: "misinformation", label: "허위정보" },
  { value: "inappropriate", label: "부적절한 행동" },
  { value: "other", label: "기타" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORY_OPTIONS)[number]["value"];

export const INQUIRY_CATEGORY_OPTIONS = [
  { value: "registration_error", label: "참가 신청 오류" },
  { value: "refund", label: "환불 문의" },
  { value: "report_followup", label: "신고 관련" },
  { value: "bug", label: "버그 제보" },
  { value: "other", label: "기타" },
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORY_OPTIONS)[number]["value"];

export const REPORT_STATUS_LABELS: Record<string, string> = {
  received: "접수됨",
  reviewing: "검토 중",
  resolved: "처리 완료",
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  open: "접수됨",
  answered: "답변 완료",
  closed: "종료",
};
