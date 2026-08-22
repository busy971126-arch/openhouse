import type { ClassScheduleEntry } from "@/lib/utils/class-schedule";
import type { GymPhotoItem } from "@/lib/utils/gym-photo-items";

export type RegistrationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type EventType = "open_mat" | "seminar" | "competition";

export type EventDifficulty = "beginner" | "experienced" | "athlete";

export type NotificationType =
  | "registration_pending"
  | "registration_approved"
  | "registration_rejected"
  | "registration_cancelled"
  | "event_announcement"
  | "new_event_gym"
  | "new_event_region";

export type SparringIntensity = "light" | "moderate" | "hard";

export type Profile = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  gender: string | null;
  age: number | null;
  age_group: string | null;
  experience: string | null;
  weight_class: string | null;
  notify_new_events: boolean;
  phone: string | null;
  parent_phone: string | null;
  regions: string[] | null;
  preferred_sports: string[] | null;
  photo_url: string | null;
  bio: string | null;
  created_at: string;
  visibility_settings?: Record<string, unknown> | null;
  pending_gym_info?: Record<string, unknown> | null;
};

export type Gym = {
  id: string;
  owner_id: string;
  name: string;
  sport: string;
  region: string;
  address: string | null;
  photo_url: string | null;
  description: string | null;
  phone: string | null;
  instagram_url: string | null;
  homepage_url: string | null;
  sns_url: string | null;
  operating_hours: string | null;
  class_schedule: ClassScheduleEntry[] | null;
  closed_days: string | null;
  facilities: string[] | null;
  facility_notes: string | null;
  first_visit_welcome: boolean | null;
  walk_in_visits: boolean | null;
  gi_rental: string | null;
  visit_details: string | null;
  preparation_guide: string | null;
  training_styles: string[] | null;
  gym_tags: string[] | null;
  mat_photos: GymPhotoItem[] | null;
  facility_photos: GymPhotoItem[] | null;
  exterior_photos: GymPhotoItem[] | null;
  parking_photos: GymPhotoItem[] | null;
  is_public: boolean;
  created_at: string;
};

export type GymPrivateContact = {
  gym_id: string;
  representative_name: string | null;
  representative_phone: string | null;
  representative_role: string | null;
  representative_role_custom: string | null;
  created_at: string;
  updated_at: string;
};

export type GymPrivateContactFields = Pick<
  GymPrivateContact,
  | "representative_name"
  | "representative_phone"
  | "representative_role"
  | "representative_role_custom"
>;

/** Owner-only gym view: public gyms row plus private contact fields. */
export type GymWithPrivateContact = Gym & GymPrivateContactFields;

export type EventLifecycleStatus = "draft" | "active" | "cancelled";

export type Event = {
  id: string;
  gym_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_type: EventType;
  sport: string;
  region: string;
  address: string | null;
  event_date: string;
  event_time: string;
  recurring_days: string[] | null;
  max_participants: number | null;
  fee_amount: number | null;
  registration_deadline: string | null;
  difficulty: EventDifficulty | null;
  recruitment_closed: boolean;
  admin_hidden_at?: string | null;
  admin_recruitment_paused_at?: string | null;
  admin_moderation_reason?: string | null;
  status?: EventLifecycleStatus;
  safety_rules: string | null;
  prohibited_techniques: string | null;
  requirements: string | null;
  safety_notes: string | null;
  emergency_contact: string | null;
  gi_rental: string | null;
  visit_details: string | null;
  created_at: string;
};

export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  operator_memo: string | null;
  seeking_sparring_partner: boolean;
  sparring_intensity: SparringIntensity | null;
  apply_weight_class: string | null;
  apply_experience: string | null;
  gym_affiliation: string | null;
  applicant_notes: string | null;
  auto_approved: boolean;
  created_at: string;
  party_id: string | null;
  party_representative_user_id: string | null;
};

export type Announcement = {
  id: string;
  event_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type EventWithGym = Event & {
  gyms: Pick<Gym, "name" | "region" | "photo_url" | "owner_id"> | null;
};

export type RegistrationWithProfile = Registration & {
  profiles: Pick<
    Profile,
    | "display_name"
    | "nickname"
    | "gender"
    | "age_group"
    | "experience"
    | "weight_class"
    | "phone"
    | "parent_phone"
    | "regions"
    | "preferred_sports"
  > | null;
};

export type EventFilters = {
  region?: string;
  sport?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: EventType;
  includePast?: boolean;
  nearbyRegions?: string[];
  searchQuery?: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  event_id: string | null;
  category: string;
  description: string;
  status: "received" | "reviewing" | "resolved";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type Inquiry = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  status: "open" | "answered" | "closed";
  admin_reply: string | null;
  created_at: string;
};

export type AdminActionLog = {
  id: string;
  admin_user_id: string | null;
  action: "inquiry.update" | "report.update";
  target_type: "inquiry" | "report";
  target_id: string;
  created_at: string;
};

export type EventInterest = {
  user_id: string;
  event_id: string;
  created_at: string;
};
