const MIN_AGE = 10;
const MAX_AGE = 99;

export function isTeensAge(age: number): boolean {
  return age >= 10 && age <= 19;
}

export function isTeensAgeInput(value: string): boolean {
  const age = parseAge(value);
  return age !== null && isTeensAge(age);
}

export function ageToAgeGroup(age: number): string {
  if (isTeensAge(age)) return "10대";
  if (age >= 20 && age <= 29) return "20대";
  if (age >= 30 && age <= 39) return "30대";
  if (age >= 40) return "30+";
  return "";
}

export function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const age = Number.parseInt(trimmed, 10);
  if (age < MIN_AGE || age > MAX_AGE) return null;

  return age;
}

export function validateAge(value: string): string | null {
  if (!value.trim()) return "나이를 입력해주세요.";

  if (!/^\d+$/.test(value.trim())) {
    return "나이는 숫자만 입력해주세요.";
  }

  const age = Number.parseInt(value.trim(), 10);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `나이는 ${MIN_AGE}~${MAX_AGE} 사이로 입력해주세요.`;
  }

  return null;
}
