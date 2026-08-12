import type { ChipOption } from "@/components/ChipMultiSelect";

/** 이벤트·회원가입 공통 종목 (MVP: 유도만 선택 가능) */
export const SIGNUP_SPORT_OPTIONS: ChipOption[] = [
  { value: "유도", label: "유도" },
  { value: "주짓수", label: "주짓수(준비중)", disabled: true },
  { value: "레슬링", label: "레슬링(준비중)", disabled: true },
];

export type SportFilterOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export const EVENT_SPORT_FILTER_OPTIONS: SportFilterOption[] = [
  { value: "유도", label: "유도" },
  { value: "주짓수", label: "주짓수(준비중)", disabled: true },
  { value: "레슬링", label: "레슬링(준비중)", disabled: true },
];
