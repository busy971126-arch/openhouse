# MVP: 참가 신청 & 호스트 관리

## 이벤트 상세 (공개)

- 날짜·시간, 체육관·주소, 참가비, 정원, 신청 마감일, 난이도
- 설명, 안전 정보, 방문·gi 안내 (`026`)
- 참가 예정자 미리보기: 체급·수련 배경·기간 분포, 대련 찾기 닉네임 (3명 이상)
- ♥ 관심 이벤트 (참가와 별도, `event_interests` — **031+**)

## 참가 신청 (로그인 사용자)

필수: 체급, 수련 배경, (일반 수련자) 수련 기간  
선택: 소속 도장, 요청 사항, 대련 상대 찾기

**동행 신청 (030+)**: accepted 운동 친구와 함께 신청 (`create_party_registration` RPC)

신청 시 `registrations`에 스냅샷 저장:

- `apply_weight_class`, `apply_experience`
- `gym_affiliation`, `applicant_notes`
- `party_id`, `party_representative_user_id` (동행 시)

## 호스트 참가자 관리

- 요약: 전체 / 대기 / 승인 / 대련 찾기
- 분포 통계 (participant preview RPC)
- 검색·필터: 상태, 체급, 대련 여부
- 실명·연락처·신청 필드·메모·승인/거절/취소·연락하기
- 승인/거절: `update_registration_status` RPC (031+, 정원 lock)

## DB 마이그레이션 (참가·호스트 관련)

Supabase SQL Editor에서 **번호 순** 실행. 전체 목록: [DATABASE.md](./DATABASE.md)

최소 참가·호스트 흐름:

1. `001` ~ `015` — 기본 스키마
2. `016_interview_features.sql` — 대련, gym_follows, preview RPC
3. `019_sparring_nickname_preview.sql` (016 미리보기만 적용된 경우)
4. `020_event_apply_host.sql` — events 메타 + registration 신청 필드
5. `021_announcement_notifications.sql` — 공지 → 참가자 알림
6. `030_party_registration.sql` — 동행 신청
7. `031_erd_mvp_completion.sql` — event_interests, reports, inquiries, capacity RPC

## 관심등록 (MVP+)

- API: `POST /api/gyms/[id]/interest`, `POST /api/events/[id]/interest`
- DB: `gym_follows`, `event_interests` (031+)
- **참가 정원과 무관**. 알림·추천·호스트 통계는 Beta.

## 아직 Beta

- 대기자 명단, 일괄 공지, 엑셀, 결제
- 관심 기반 푸시 알림
- 후기·별점

## Related

- [PROJECT.md](../PROJECT.md) — MVP / MVP+ / Beta
- [ROUTES.md](./ROUTES.md) — 화면·API
- [ERD_V1.1_MAPPING.md](./ERD_V1.1_MAPPING.md)
