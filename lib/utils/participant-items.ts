import type { RegistrationStatus } from "@/lib/types/database";

export type ParticipantItem = {
  id: string;
  userId: string | null;
  displayName: string | null;
  nickname: string | null;
  gender: string | null;
  ageGroup: string | null;
  weightClass: string | null;
  experience: string | null;
  gymAffiliation: string | null;
  applicantNotes: string | null;
  seekingSparring: boolean;
  phone: string | null;
  parentPhone: string | null;
  regions: string[] | null;
  preferredSports: string[] | null;
  status: RegistrationStatus;
  operatorMemo: string | null;
  createdAt: string;
};

type RegistrationRow = {
  id: string;
  user_id: string | null;
  status: string;
  apply_weight_class: string | null;
  apply_experience: string | null;
  gym_affiliation: string | null;
  applicant_notes: string | null;
  seeking_sparring_partner: boolean | null;
  operator_memo: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    nickname: string | null;
    gender: string | null;
    age_group: string | null;
    experience: string | null;
    weight_class: string | null;
    phone: string | null;
    parent_phone: string | null;
    regions: string[] | null;
    preferred_sports: string[] | null;
  } | null;
};

export function mapRegistrationToParticipantItem(
  reg: RegistrationRow,
): ParticipantItem {
  return {
    id: reg.id,
    userId: reg.user_id ?? null,
    displayName: reg.profiles?.display_name ?? null,
    nickname: reg.profiles?.nickname ?? null,
    gender: reg.profiles?.gender ?? null,
    ageGroup: reg.profiles?.age_group ?? null,
    weightClass:
      reg.apply_weight_class?.trim() ||
      reg.profiles?.weight_class?.trim() ||
      null,
    experience:
      reg.apply_experience?.trim() || reg.profiles?.experience?.trim() || null,
    gymAffiliation: reg.gym_affiliation ?? null,
    applicantNotes: reg.applicant_notes ?? null,
    seekingSparring: reg.seeking_sparring_partner ?? false,
    phone: reg.profiles?.phone ?? null,
    parentPhone: reg.profiles?.parent_phone ?? null,
    regions: reg.profiles?.regions ?? null,
    preferredSports: reg.profiles?.preferred_sports ?? null,
    status: reg.status as RegistrationStatus,
    operatorMemo: reg.operator_memo ?? null,
    createdAt: reg.created_at,
  };
}

export function countParticipantStats(items: ParticipantItem[]) {
  const approved = items.filter((item) => item.status === "approved").length;
  const pending = items.filter((item) => item.status === "pending").length;
  const cancelled = items.filter(
    (item) => item.status === "cancelled" || item.status === "rejected",
  ).length;

  return {
    total: items.length,
    approved,
    pending,
    cancelled,
    sparring: items.filter((item) => item.seekingSparring).length,
  };
}
