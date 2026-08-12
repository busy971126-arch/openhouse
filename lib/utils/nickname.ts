import {
  NICKNAME_ACTION_WORDS,
  NICKNAME_ADJECTIVE_WORDS,
  NICKNAME_BLOCKLIST,
  NICKNAME_NOUN_WORDS,
  NICKNAME_SPORT_WORDS,
} from "@/lib/constants/nickname-words";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export function normalizeNickname(value: string): string {
  return value.trim();
}

export function normalizeForProfanityCheck(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function containsProfanity(value: string): boolean {
  const normalized = normalizeForProfanityCheck(value);
  if (!normalized) return false;

  return NICKNAME_BLOCKLIST.some((word) => {
    const blocked = normalizeForProfanityCheck(word);
    return blocked.length > 0 && normalized.includes(blocked);
  });
}

export function validateNicknameFormat(value: string): string | null {
  const trimmed = normalizeNickname(value);
  if (!trimmed) {
    return "닉네임을 입력해주세요.";
  }
  if (trimmed.length < NICKNAME_MIN) {
    return `닉네임은 ${NICKNAME_MIN}자 이상 입력해주세요.`;
  }
  if (trimmed.length > NICKNAME_MAX) {
    return `닉네임은 ${NICKNAME_MAX}자 이하로 입력해주세요.`;
  }
  if (containsProfanity(trimmed)) {
    return "사용할 수 없는 표현이 포함되어 있습니다.";
  }
  return null;
}

/** @deprecated use validateNicknameFormat */
export function validateNickname(value: string): string | null {
  return validateNicknameFormat(value);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function generateRandomNickname(): string {
  const patterns = [
    () =>
      `${pickRandom(NICKNAME_SPORT_WORDS)}${pickRandom(NICKNAME_ACTION_WORDS)}${pickRandom(NICKNAME_NOUN_WORDS)}`,
    () =>
      `${pickRandom(NICKNAME_ADJECTIVE_WORDS)}${pickRandom(NICKNAME_NOUN_WORDS)}`,
    () =>
      `${pickRandom(NICKNAME_SPORT_WORDS)}${pickRandom(NICKNAME_NOUN_WORDS)}${pickRandom([...Array(90)].map((_, i) => i + 10))}`,
  ];

  const nickname = pickRandom(patterns)();
  return nickname.slice(0, NICKNAME_MAX);
}

export type NicknameCheckResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

export function checkNicknameLocally(value: string): NicknameCheckResult {
  const nickname = normalizeNickname(value);
  const formatError = validateNicknameFormat(nickname);
  if (formatError) {
    return { ok: false, error: formatError };
  }
  return { ok: true, nickname };
}
