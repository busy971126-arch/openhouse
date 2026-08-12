/** Supabase/Auth 에러에서 사람이 읽을 수 있는 메시지 추출 */
export function getSupabaseErrorMessage(
  error: unknown,
  fallback = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed && trimmed !== "{}" ? trimmed : fallback;
  }

  if (error instanceof Error) {
    const trimmed = error.message.trim();
    if (trimmed && trimmed !== "{}" && trimmed !== "[object Object]") {
      return trimmed;
    }

    if (error.cause) {
      const fromCause = getSupabaseErrorMessage(error.cause, "");
      if (fromCause && fromCause !== "SUPABASE_CONNECTION_FAILED") {
        return fromCause;
      }
    }

    if (error.name === "AuthRetryableFetchError") {
      const status = (error as { status?: number }).status;
      if (status === 500) {
        return "unexpected_failure";
      }
      return "SUPABASE_CONNECTION_FAILED";
    }
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    const status = record.status;
    if (typeof status === "number" && status === 500) {
      return "unexpected_failure";
    }

    const message = record.message;
    if (typeof message === "string") {
      const trimmed = message.trim();
      if (trimmed && trimmed !== "{}") return trimmed;
    }

    if (typeof record.msg === "string") {
      const trimmed = record.msg.trim();
      if (trimmed) return trimmed;
    }

    if (typeof record.error_description === "string") {
      const trimmed = record.error_description.trim();
      if (trimmed) return trimmed;
    }

    const errorCode = record.error_code;
    if (typeof errorCode === "string") {
      const mapped = mapSupabaseErrorCode(errorCode);
      if (mapped) return mapped;
    }

    const code = record.code;
    if (typeof code === "string") {
      const mapped = mapSupabaseErrorCode(code);
      if (mapped) return mapped;
    }
  }

  return fallback;
}

function mapSupabaseErrorCode(code: string): string | null {
  switch (code) {
    case "PGRST204":
      return "데이터베이스 설정이 최신이 아닙니다. 관리자에게 문의해주세요.";
    case "42501":
      return "권한이 없습니다. 로그인 상태를 확인해주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.";
    case "unexpected_failure":
      return "계정 생성 중 데이터베이스 오류가 발생했습니다. Supabase SQL Editor에서 supabase/migrations/018_signup_ensure.sql을 실행해주세요.";
    case "weak_password":
      return "비밀번호가 너무 약합니다. 8자 이상으로 설정해주세요.";
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "email_address_invalid":
      return "이메일 주소 형식이 올바르지 않습니다. 다시 확인해주세요.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "요청이 너무 많습니다. 1~2분 후 다시 시도해주세요.";
    default:
      return null;
  }
}

export function mapSignupError(error: unknown): string {
  const message = getSupabaseErrorMessage(error, "");
  const lower = message.toLowerCase();

  if (!message) {
    return "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  const mappedCode = mapSupabaseErrorCode(message);
  if (mappedCode) {
    return mappedCode;
  }

  if (message === "SUPABASE_CONNECTION_FAILED") {
    return "Supabase 서버에 연결하지 못했습니다. .env.local 설정과 프로젝트 상태(일시정지 여부)를 확인한 뒤 dev 서버를 재시작해주세요.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("authretryablefetcherror")
  ) {
    return "Supabase 서버에 연결하지 못했습니다. .env.local 설정과 프로젝트 상태(일시정지 여부)를 확인한 뒤 dev 서버를 재시작해주세요.";
  }

  if (
    lower.includes("database error saving new user") ||
    lower.includes("profile_create_failed")
  ) {
    const detail = message.includes("profile_create_failed:")
      ? message.split("profile_create_failed:")[1]?.trim()
      : "";
    if (detail) {
      if (detail.includes("weight_class") || detail.includes("parent_phone")) {
        return "프로필 DB 컬럼이 누락되었습니다. Supabase SQL Editor에서 018_signup_ensure.sql을 실행해주세요.";
      }
      if (detail.includes("nickname") && detail.includes("unique")) {
        return "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.";
      }
      return `프로필 저장 실패: ${detail}`;
    }
    return "프로필 저장에 실패했습니다. Supabase SQL Editor에서 018_signup_ensure.sql을 실행한 뒤 다시 시도해주세요.";
  }

  if (message.includes("weight_class") || message.includes("PGRST204")) {
    return "서비스 설정 업데이트가 필요합니다. Supabase에 016 마이그레이션을 적용해주세요.";
  }

  if (
    lower.includes("nickname") &&
    (lower.includes("duplicate") || lower.includes("unique"))
  ) {
    return "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already exists")
  ) {
    return "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.";
  }

  if (lower.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  ) {
    return "프로필 저장 권한이 없습니다. 이메일 인증 후 로그인해주세요.";
  }

  if (lower.includes("email not confirmed")) {
    return "이메일 인증이 필요합니다. 메일함을 확인해주세요.";
  }

  if (lower.includes("is invalid") && lower.includes("email")) {
    if (lower.includes("@gamil.com")) {
      return "이메일 주소가 올바르지 않습니다. @gmail.com 오타인지 확인해주세요.";
    }
    return "이메일 주소 형식이 올바르지 않습니다. 다시 확인해주세요.";
  }

  return message;
}

/** signUp metadata — null/빈값 제거 (Supabase 호환) */
export function sanitizeSignupMetadata(
  data: Record<string, unknown>,
): Record<string, string | number | boolean | string[]> {
  const result: Record<string, string | number | boolean | string[]> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value as string | number | boolean | string[];
  }

  return result;
}
