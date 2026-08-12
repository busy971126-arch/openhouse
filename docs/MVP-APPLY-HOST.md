# MVP: 참가 신청 & 호스트 관리

## 이벤트 상세 (공개)

- 날짜·시간, 체육관·주소, 참가비, 정원, 신청 마감일, 난이도
- 설명, 안전 정보, 체육관 운영 시간
- 참가 예정자 미리보기: 체급·수련 배경·기간 분포, 대련 찾기 닉네임 (3명 이상)

## 참가 신청 (로그인 사용자)

필수: 체급, 수련 배경, (일반 수련자) 수련 기간  
선택: 소속 도장, 요청 사항, 대련 상대 찾기

신청 시 `registrations`에 스냅샷 저장:

- `apply_weight_class`, `apply_experience`
- `gym_affiliation`, `applicant_notes`

## 호스트 참가자 관리

- 요약: 전체 / 대기 / 승인 / 대련 찾기
- 분포 통계 (EventParticipantPreview RPC)
- 검색·필터: 상태, 체급, 대련 여부
- 실명·연락처·신청 필드·메모·승인/거절/취소·연락하기

## DB 마이그레이션

Supabase SQL Editor에서 순서대로 실행:

1. `019_sparring_nickname_preview.sql` (미적용 시)
2. `020_event_apply_host.sql` — events 메타 + registration 신청 필드 + preview RPC
3. `021_announcement_notifications.sql` — 공지 → 참가자 알림, 참가 취소 → 호스트 알림

## 아직 MVP 밖

- 대기자 명단, 일괄 공지, 엑셀, 결제
