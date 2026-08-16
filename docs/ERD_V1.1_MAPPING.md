# OpenHouse ERD V1.1 — DB 매핑

ERD V1.0 문서 이름과 실제 Supabase 스키마 대응표입니다. **DB rename 없이** 이 문서를 기준으로 작업합니다.

| ERD | 실제 테이블/컬럼 |
|---|---|
| User | `auth.users` + `profiles` |
| User.nickname | `profiles.nickname` |
| User.email | `auth.users.email` |
| User.phone | `profiles.phone` |
| User.weight_class | `profiles.weight_class` |
| User.training_period | `profiles.experience` |
| User.sport | `profiles.preferred_sports[]` |
| User.role | 체육관 `gyms.owner_id`로 호스트 권한 암시 |
| Gym | `gyms` |
| Gym.host_user_id | `gyms.owner_id` |
| Event | `events` |
| Event.host_user_id | `events.created_by` |
| Event.category | `events.event_type` |
| Event.capacity | `events.max_participants` |
| Event.status | `events.status` (`active` / `cancelled`) |
| Friendship | `friendships` |
| Friendship.receiver_id | `friendships.addressee_id` |
| Participation | `registrations` |
| Participation.group_id | `registrations.party_id` |
| Participation.is_representative | `party_representative_user_id = user_id` |
| FieldVisibility | `profiles.visibility_settings` (JSONB) |
| Report | `reports` (031+) |
| Inquiry | `inquiries` (031+) |
| GymInterest | `gym_follows` |
| EventInterest | `event_interests` (031+) |

## QA 제약

| 제약 | 구현 |
|---|---|
| UNIQUE(event_id, user_id) | `idx_registrations_active_unique` (pending/approved) |
| 정원 race 방지 | `check_event_capacity` + `FOR UPDATE` + `update_registration_status` RPC |
| Friendship 양방향 중복 | `idx_friendships_pair_unique` (031+) |
| 동행 = accepted 친구 | `create_party_registration` RPC |
| visibility 서버 필터 | `lib/queries/profile-visibility.ts` |
| GymInterest unique | `gym_follows` PK |
| EventInterest unique | `event_interests` PK |

## Related docs

- [DATABASE.md](./DATABASE.md) — 마이그레이션 · 테이블
- [PROJECT.md](../PROJECT.md) — MVP / MVP+ / Beta
- [ROUTES.md](./ROUTES.md) — API · 화면
