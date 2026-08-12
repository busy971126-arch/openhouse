export type EventDifficulty = "beginner" | "experienced" | "athlete";

export const EVENT_DIFFICULTY_OPTIONS: {
  value: EventDifficulty;
  label: string;
}[] = [
  { value: "beginner", label: "초보 가능" },
  { value: "experienced", label: "유경험자" },
  { value: "athlete", label: "선수" },
];

export function formatEventFee(amount: number | null | undefined): string | null {
  if (amount == null || amount <= 0) return "무료";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatEventDifficulty(
  difficulty: EventDifficulty | string | null | undefined,
): string | null {
  if (!difficulty) return null;
  return (
    EVENT_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)
      ?.label ?? null
  );
}

export function formatRegistrationDeadline(date: string | null | undefined) {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
