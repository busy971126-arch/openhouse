# OpenHouse Routes

화면·URL 기준 문서. 최종 갱신: 마이그레이션 **031** · 관심등록 MVP+ 반영.

---

## Public

| URL | 화면 | Auth |
|-----|------|------|
| `/` | 홈 (게스트 / 회원 / 운영자 분기) | — |
| `/login` | 로그인 | guest |
| `/login/recover` | 이메일 찾기 · 비밀번호 재설정 메일 | guest |
| `/login/reset-password` | 새 비밀번호 설정 (이메일 링크) | guest |
| `/signup` | 회원가입 | guest |
| `/events` | 이벤트 탐색 (필터·검색·캘린더 뷰) | — |
| `/events?tab=gyms` | 체육관 탐색 (필터·정렬) | — |
| `/events/[id]` | 이벤트 상세 · 신청 · 공지 · 관심 ♥ | — |
| `/gym/[id]` | 체육관 상세 · 예정 이벤트 · 관심 ♥ | — |
| `/users/[id]` | 공개 프로필 | — |

---

## Member (로그인 필요)

| URL | 화면 |
|-----|------|
| `/my` | 마이페이지 허브 |
| `/my/profile` | 프로필 보기 (운영자: 체육관·일정·참가 관리 진입) |
| `/my/profile/edit` | 프로필 수정 |
| `/my/registrations` | 내 참가 (예정 / 지난 참가) |
| `/my/interests` | ❤️ 관심 (이벤트 / 체육관 탭) |
| `/my/friends` | 🤝 운동 친구 |
| `/my/notifications` | 🔔 앱 내 알림 |
| `/my/settings` | ⚙️ 설정 |
| `/my/settings/password` | 비밀번호 변경 |
| `/my/settings/privacy` | 프로필 공개 범위 |
| `/my/inquiries` | 💬 문의하기 |
| `/my/reports` | 신고 내역 |
| `/my/terms` | 약관 (stub) |
| `/my/withdraw` | 회원 탈퇴 |

### Redirect

| URL | → |
|-----|---|
| `/my/wishlist` | `/my/interests?tab=gyms` |
| `/my/event-interests` | `/my/interests?tab=events` |
| `/my/operator` | `/my/profile` |
| `/dashboard` | `/my/profile` |

---

## Operator / Host

| URL | 화면 |
|-----|------|
| `/gym/new` | 체육관 등록 |
| `/gym/[id]/edit` | 체육관 수정 |
| `/events/new` | 이벤트 등록 |
| `/events/[id]/edit` | 이벤트 수정 |
| `/events/[id]/participants` | → `/host/participants` 리다이렉트 (레거시) |
| `/events/[id]/apply/complete` | 신청 완료 |
| `/host/gyms` | 내 체육관 목록 |
| `/host/gyms/[gymId]` | 체육관 호스트 상세 |
| `/host/gyms/[gymId]/events` | 체육관별 이벤트 |
| `/host/participants` | 참가자 관리 허브 |
| `/host/participants/[eventId]/[registrationId]` | 참가자 상세 |

운영자는 별도 계정 없이 **체육관 owner** 권한으로 위 화면에 접근한다. 홈(`/`)은 운영자일 때 **HostHome** 대시보드를 표시한다.

---

## Admin (Closed Beta)

`admin_users`에 등록된 운영자만. middleware는 로그인만 확인하고, admin 여부는 layout + RLS가 검사한다.

| URL | 화면 |
|-----|------|
| `/admin` | Overview · Needs Attention |
| `/admin/inquiries` | 문의 목록 |
| `/admin/inquiries/[id]` | 문의 상세 · 답변 |
| `/admin/reports` | 신고 목록 |
| `/admin/reports/[id]` | 신고 상세 · 상태 |
| `/admin/gyms` | 체육관 검색 |
| `/admin/events` | 이벤트 검색 · draft/active/cancelled |
| `/admin/events/[id]` | 이벤트 상세 (read-only). draft/private도 RPC로 조회 |
| `/admin/users` | 사용자 검색 (read-only) |

---

## API (Route Handlers)

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/gyms/[id]/interest` | 관심 체육관 토글 |
| POST | `/api/events/[id]/interest` | 관심 이벤트 토글 |
| GET | `/api/users/me/interests/gyms` | 내 관심 체육관 목록 |
| GET | `/api/users/me/interests/events` | 내 관심 이벤트 목록 |
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/account/withdraw` | 회원 탈퇴 |
| GET | `/api/nickname/check` | 닉네임 중복 확인 |
| GET | `/api/nickname/suggest` | 닉네임 제안 |
| GET | `/api/geocode/reverse` | 역지오코딩 |
| PATCH | `/api/admin/inquiries/[id]` | 관리자 문의 답변/상태 |
| PATCH | `/api/admin/reports/[id]` | 관리자 신고 상태 |

---

## `/events` 쿼리 파라미터

### 공통 · 이벤트 탭

| Query | 설명 |
|-------|------|
| `tab` | `gyms` — 체육관 탭 |
| `type` | `open_mat`, `seminar`, `competition` |
| `region` | 지역 (부분 일치) |
| `sport` | 종목 |
| `date` | 날짜 (YYYY-MM-DD) |
| `past=1` | 종료 이벤트 포함 |
| `quick` | 빠른 필터 (`today`, `weekend`, …) |
| `q` | 검색어 |
| `view` | `list` / `calendar` |
| `status` | 모집 상태 필터 |

### 체육관 탭 (`tab=gyms`)

| Query | 설명 |
|-------|------|
| `facilities` | 시설 필터 |
| `beginner` | 초보 환영 |
| `hasEvents` | 예정 이벤트 있음 |
| `sort` | `recommended`, `distance`, `events`, `recent`, `name` |

---

## 마이페이지 IA

```text
마이페이지
├─ 프로필
├─ 내 참가
├─ ❤️ 관심 (관심 이벤트 / 관심 체육관)
├─ 🤝 운동 친구
├─ 🔔 알림
├─ ⚙️ 설정
├─ 💬 문의하기
└─ (약관 · 탈퇴)
```

**후기** 메뉴는 Beta(미구현).

---

## UI 패턴

- **이벤트 카드**: 종목 · 모집 상태 · ♥ (우측)
- **체육관 카드**: 이미지(종목 태그·캐러셀) + 하단 정보(이름 ♥ · 주소 · 추천 사유)
- **관심등록**: 참가 신청과 분리, optimistic UI + 토스트
- **모바일 우선**: 하단 네비 · 카드형 리스트

---

## 관련 문서

- [PROJECT.md](../PROJECT.md) — MVP / MVP+ / Beta 범위
- [DATABASE.md](./DATABASE.md) — 스키마
- [ERD_V1.1_MAPPING.md](./ERD_V1.1_MAPPING.md) — ERD 매핑
