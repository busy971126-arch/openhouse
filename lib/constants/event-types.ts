export type EventType = "open_mat" | "seminar" | "competition";

export const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
}[] = [
  { value: "open_mat", label: "오픈매트" },
  { value: "seminar", label: "세미나" },
  { value: "competition", label: "대회" },
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  open_mat: "오픈매트",
  seminar: "세미나",
  competition: "대회",
};

export function formatEventType(value: string | null | undefined): string {
  if (!value) return "오픈매트";
  return EVENT_TYPE_LABELS[value as EventType] ?? value;
}
