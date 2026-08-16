/** registrations.user_id → profiles (030+ adds a second FK via party_representative_user_id) */
export const REGISTRATION_WITH_PROFILE_SELECT =
  "*, profiles!user_id(display_name, nickname, gender, age_group, experience, weight_class, phone, parent_phone, regions, preferred_sports)";
