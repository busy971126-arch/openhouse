/** Public gym columns. Excludes owner-only representative_* contact fields. */
export const PUBLIC_GYM_SELECT =
  "id, owner_id, name, sport, region, address, photo_url, description, phone, instagram_url, homepage_url, sns_url, operating_hours, class_schedule, closed_days, facilities, facility_notes, first_visit_welcome, walk_in_visits, gi_rental, visit_details, preparation_guide, training_styles, gym_tags, mat_photos, facility_photos, exterior_photos, parking_photos, is_public, created_at" as const;

/**
 * Owner edit load only. Legacy gyms.representative_* is a transition fallback
 * until STEP C drops those columns. Do not use in public queries.
 */
export const GYM_OWNER_EDIT_SELECT =
  `${PUBLIC_GYM_SELECT}, representative_name, representative_phone, representative_role, representative_role_custom` as const;

export const GYM_PRIVATE_CONTACT_SELECT =
  "representative_name, representative_phone, representative_role, representative_role_custom" as const;

export const GYM_PRIVATE_CONTACT_WITH_ID_SELECT =
  `gym_id, ${GYM_PRIVATE_CONTACT_SELECT}` as const;

export const EVENT_WITH_PUBLIC_GYM_SELECT =
  `*, gyms(${PUBLIC_GYM_SELECT})` as const;
