/** 수업 시간표 요일 (월~일) */
export const CLASS_SCHEDULE_DAYS = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일",
] as const;

export type ClassScheduleDay = (typeof CLASS_SCHEDULE_DAYS)[number];

export const CLASS_SCHEDULE_DAY_ORDER: Record<ClassScheduleDay, number> = {
  월: 0,
  화: 1,
  수: 2,
  목: 3,
  금: 4,
  토: 5,
  일: 6,
};
