import type { ParticipantItem } from "@/lib/utils/participant-items";

export type ParticipantPartyGroup = {
  key: string;
  leader: ParticipantItem;
  companions: ParticipantItem[];
};

export function isPartyLeader(item: ParticipantItem): boolean {
  if (!item.partyId) return true;
  return item.partyRepresentativeUserId === item.userId;
}

export function organizeParticipantParties(
  items: ParticipantItem[],
): ParticipantPartyGroup[] {
  const solos: ParticipantPartyGroup[] = [];
  const partyMembers = new Map<string, ParticipantItem[]>();

  for (const item of items) {
    if (!item.partyId) {
      solos.push({ key: item.id, leader: item, companions: [] });
      continue;
    }

    const members = partyMembers.get(item.partyId) ?? [];
    members.push(item);
    partyMembers.set(item.partyId, members);
  }

  const partyGroups: ParticipantPartyGroup[] = [];

  for (const members of partyMembers.values()) {
    const leader =
      members.find(
        (member) => member.userId === member.partyRepresentativeUserId,
      ) ?? members[0];
    const companions = members.filter((member) => member.id !== leader.id);

    partyGroups.push({
      key: leader.id,
      leader,
      companions,
    });
  }

  return [...partyGroups, ...solos].sort(
    (a, b) =>
      new Date(b.leader.createdAt).getTime() -
      new Date(a.leader.createdAt).getTime(),
  );
}

export function formatPartyCompanionLabel(
  companion: ParticipantItem,
): string {
  return (
    companion.nickname?.trim() ||
    companion.displayName?.trim() ||
    "회원"
  );
}

export function mapPartyRegistrationError(code: string): string {
  return mapRegistrationApplyError(code, "동행 신청에 실패했습니다.");
}

const REGISTRATION_APPLY_ERROR_CODES = [
  "LOGIN_REQUIRED",
  "WEIGHT_CLASS_REQUIRED",
  "EXPERIENCE_REQUIRED",
  "COMPANIONS_REQUIRED",
  "TOO_MANY_COMPANIONS",
  "ALREADY_REGISTERED",
  "NOT_FRIENDS",
  "COMPANION_ALREADY_REGISTERED",
  "EVENT_NOT_FOUND",
  "EVENT_CANCELLED",
  "REGISTRATION_CLOSED",
] as const;

export function mapRegistrationApplyError(
  code: string,
  fallback = "참가 신청에 실패했습니다.",
): string {
  switch (code) {
    case "LOGIN_REQUIRED":
      return "로그인이 필요합니다.";
    case "WEIGHT_CLASS_REQUIRED":
      return "체급을 선택해주세요.";
    case "EXPERIENCE_REQUIRED":
      return "수련 정보를 확인해주세요.";
    case "COMPANIONS_REQUIRED":
      return "동행할 운동 친구를 1명 이상 선택해주세요.";
    case "TOO_MANY_COMPANIONS":
      return "동행 인원은 최대 5명까지 선택할 수 있습니다.";
    case "ALREADY_REGISTERED":
      return "이미 이 이벤트에 신청했습니다.";
    case "NOT_FRIENDS":
      return "운동 친구만 동행 신청할 수 있습니다.";
    case "COMPANION_ALREADY_REGISTERED":
      return "선택한 운동 친구 중 이미 신청한 사람이 있습니다.";
    case "EVENT_NOT_FOUND":
      return "이벤트를 찾을 수 없습니다.";
    case "EVENT_CANCELLED":
      return "취소된 이벤트입니다.";
    case "REGISTRATION_CLOSED":
      return "신청이 마감된 이벤트입니다.";
    default:
      return fallback;
  }
}

export function parseRegistrationApplyError(
  message: string,
  fallback = "참가 신청에 실패했습니다.",
): string {
  for (const code of REGISTRATION_APPLY_ERROR_CODES) {
    if (message.includes(code)) {
      return mapRegistrationApplyError(code, fallback);
    }
  }

  if (isMissingRegistrationRpc(message)) {
    return "참가 신청 기능이 아직 서버에 반영되지 않았습니다. Supabase SQL Editor에서 036_solo_registration_rpc.sql을 실행한 뒤 다시 시도해주세요.";
  }

  if (message.includes("Event is full")) {
    return "정원이 마감되어 신청할 수 없습니다.";
  }

  if (message.includes("invalid input value for enum registration_status")) {
    return "참가 신청 처리 중 오류가 발생했습니다. Supabase SQL Editor에서 037_fix_registration_capacity_trigger.sql을 실행한 뒤 페이지를 새로고침해주세요.";
  }

  return message || fallback;
}

export function isMissingRegistrationRpc(message: string): boolean {
  return (
    message.includes("Could not find the function") &&
    message.includes("schema cache")
  );
}

export function parsePartyRegistrationError(message: string): string {
  return parseRegistrationApplyError(message, "동행 신청에 실패했습니다.");
}
