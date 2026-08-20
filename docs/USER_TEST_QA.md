# OpenHouse User Test QA Audit

- Audit date: 2026-08-20
- Updated: 2026-08-20 (STEP 4-5A — Registration Server Invariant)
- Scope: STEP 4-1 Core Flow QA + STEP 4-2 local schema alignment + STEP 4-5A registration guards
- Method: repository audit + local DB functional test. Production DB unchanged.

Status legend (code audit, not live tester run):

- **CODE-PASS** — 구현이 Golden Path를 지원함. 수동 확인은 여전히 필요.
- **CODE-RISK** — 핵심 흐름은 있으나 실패/혼란 가능성이 있음.
- **BLOCKED** — 현재 코드/스키마 기준으로 해당 기능이 사용자 테스트에서 막힐 가능성이 큼.
- **UNKNOWN** — 환경설정(이메일 인증 등) 또는 Preview 실기기에 의존.

Automated Test:

- **YES** — 해당 시나리오를 직접 검증하는 테스트 존재
- **PARTIAL** — 관련 unit test만 존재
- **NO** — 없음

Playwright / Cypress: **없음**. E2E 프레임워크 없음. 테스트는 Vitest unit (`npm run test`)만 존재.

---

## 1. Current core flow map

```text
Guest
  /signup → (이메일 인증 가능) → /login
  → / 또는 /events → /events/[id]
  → POST /api/events/[id]/register (solo|party)
  → /events/[id]/apply/complete
  → /my/registrations (pending 확인)
  → host 승인 후 /my/registrations (approved)
  → 참가 취소 (registrations UPDATE cancelled)

Host
  /login → / (HostHome) 또는 /host/gyms
  → /events/new · /events/[id]/edit
  → /host/participants?gym=&event=
  → update_registration_status (approved|rejected|cancelled)
```

승인 모델: `pending` → host 수동 승인 → `approved` / `rejected`.  
auto approval UI/RPC는 제거됨 (`docs/SECURITY_ADVISOR_EXCEPTIONS.md`, PR #8).

---

## 2. Feature → file / route map

| # | Feature | Route / API | Key implementation |
|---|---------|-------------|--------------------|
| 1 | 회원가입 | `/signup`, `POST /api/auth/signup` | `app/signup/page.tsx`, `app/api/auth/signup/route.ts`, `app/auth/callback/route.ts` |
| 2 | 로그인 | `/login` | `app/login/LoginForm.tsx` `signInWithPassword` |
| 3 | 로그아웃 | `/my` | `components/LogoutButton.tsx`, `components/my/MyLogoutButton.tsx` |
| 4 | 홈 | `/` | `app/page.tsx` GuestHome / MemberHome / HostHome |
| 5 | 이벤트 목록 | `/events` | `app/events/page.tsx`, `app/events/EventList.tsx` |
| 6 | 이벤트 필터 | `/events?type&region&q&status&quick&view` | `EventFilterBar`, `lib/queries/events.ts` |
| 7 | 이벤트 상세 | `/events/[id]` | `app/events/[id]/page.tsx` |
| 8 | 체육관 목록 | `/events?tab=gyms` | `app/events/GymList.tsx` |
| 9 | 체육관 상세 | `/gym/[id]` | `app/gym/[id]/page.tsx` + **middleware `/gym/` 보호** |
| 10 | 관심 이벤트 | `POST /api/events/[id]/interest`, `/my/interests` | `InterestHeart`, `app/my/interests/page.tsx` |
| 11 | 관심 체육관 | `POST /api/gyms/[id]/interest` | 동일 |
| 12 | solo 신청 | `POST /api/events/[id]/register` | `create_solo_registration` → pending |
| 13 | party 신청 | 동일 `mode=party` | `create_party_registration` |
| 14 | 신청 내역 | `/my/registrations` | `getUserRegistrations` |
| 15 | 신청 취소 | 내 일정 / 이벤트 상세 | `MyRegistrationCard`, `CancelButton` → RLS UPDATE cancelled |
| 16 | host 이벤트 생성 | `/events/new` | `components/events/EventForm.tsx` |
| 17 | host 이벤트 수정 | `/events/[id]/edit` | 동일 EventForm + owner redirect |
| 18 | host 신청자 목록 | `/host/participants` | `HostParticipantsManager` |
| 19 | 승인 | RPC | `update_registration_status(..., approved)` |
| 20 | 거절 | RPC | `update_registration_status(..., rejected)` |
| 21 | 정원 제한 | UI + DB trigger | `getEventRecruitmentStatus`, `check_event_capacity` |
| 22 | 신청 마감 | UI + API + RPC | `registration_deadline` / `recruitment_closed` / `status=cancelled` — local 가드 (`20260820141029`). Production 반영은 별도 승인 |
| 23 | 친구 / 프로필 | `/my/friends`, `/users/[id]` | `search_profiles`, `get_public_profile` (로그인 필요) |
| 24 | notification | `/my/notifications` | `notifications` 테이블, 신청/공지 트리거 |
| 25 | visibility | `/my/settings/privacy` | `visibility_settings` + preview mask |

Auth guard: `middleware.ts` — `/dashboard`, `/gym/new`, `/events/new`, `/my`, `/host`, **모든 `/gym/`**, `/events/[id]/participants`, `/events/[id]/edit`.

---

## 3. QA matrix

| ID | Role | Scenario | Precondition | Steps | Expected Result | Current Implementation | Automated Test | Manual Test Required | Risk | Status | Notes |
|----|------|----------|--------------|-------|-----------------|------------------------|----------------|----------------------|------|--------|-------|
| G01 | Guest | 로그아웃 홈 진입 | 세션 없음 | `/` 접속 | 게스트 홈, 모집 이벤트, 로그인/회원가입 CTA, 500 없음 | `app/page.tsx` `GuestHome` | PARTIAL (`home-events.test.ts`) | YES | — | CODE-PASS | 이벤트 로드 실패 시 빈 목록으로 침묵 (`loadRecruitingEvents`) |
| G02 | Guest | 회원가입 | 유효 이메일 | `/signup` 제출 | 계정 생성. 세션 있으면 홈, 없으면 이메일 인증 안내 | `POST /api/auth/signup` | PARTIAL (`auth-errors.test.ts`) | YES | MANUAL ENV QA | UNKNOWN | signup code supports no-session / email-confirmation flow. Hosted Confirm email setting is UNKNOWN and must be checked manually. Confirmation email delivery must be tested before external beta |
| G03 | Guest | 로그인 | 확인된 계정 | `/login` | 세션 생성 후 `redirect` 또는 `/` | `LoginForm` | PARTIAL | YES | — | CODE-PASS | 실패 시 `mapSignupError` |
| G04 | Guest | 이벤트 목록 | 공개 이벤트 존재 | `/events` | 공개 체육관 이벤트 목록, 정원 숫자 | `EventList` + `get_event_registration_counts` | PARTIAL (`event-status`, `home-events`) | YES | — | CODE-PASS | RPC 실패 시 정원 0으로 silent fallback |
| G05 | Guest | 이벤트 상세 | 유효 event id | `/events/[id]` | 상세, 정원, 로그인 후 신청 CTA | `app/events/[id]/page.tsx` | PARTIAL | YES | — | CODE-PASS | preview는 로그인 유도 (`requiresAuth`) |
| G06 | Member | solo 참가 신청 | 로그인, 모집 중 | 상세에서 체급·수련 입력 → 신청 | `registrations.status = pending` | `create_solo_registration` | PARTIAL (`participant-party.test.ts` 에러 매핑) | YES | — | CODE-PASS | 버튼 `disabled={loading}`. fallback insert는 pending |
| G07 | Member | 신청 상태 확인 | G06 완료 | `/my/registrations` | 승인 대기 표시, 완료 배너(`applied=1`) | `MyRegistrationCard` + `REGISTRATION_STATUS_DISPLAY` | PARTIAL (`registration-status` 로직은 unit 없음에 가깝고 display util만) | YES | — | CODE-PASS | `getUserRegistrations` error 무시하고 빈 목록 가능 |
| H01 | Host | host 로그인 | gym owner 계정 | `/login` | HostHome 또는 운영자 홈 | `getMyPageData` `isOperator` | PARTIAL (`host-home.test.ts`) | YES | — | CODE-PASS | 체육관 없으면 회원 홈 |
| H02 | Host | 신청자 확인 | 본인 이벤트에 pending | `/host/participants` | 신청자 목록 | `getHostParticipantsForEvent` RLS | PARTIAL (`host-participant-*.test.ts`) | YES | — | CODE-PASS | gym 없으면 등록 CTA. 일정 0이면 EmptyState |
| H03 | Host | pending 승인 | H02 | 참가 확정 | `pending → approved` | `update_registration_status` + `is_event_owner` | NO | YES | — | CODE-PASS | 에러 시 RPC raw message |
| G08 | Member | approved 확인 | H03 | 내 일정 / 상세 | 참가 확정 | display util + 상세는 pending/approved만 조회 | PARTIAL | YES | — | CODE-PASS | 알림 트리거 `notify_on_registration` |
| G09 | Member | 참가 취소 | pending 또는 approved | 내 일정 취소 | `cancelled`, 정원 재개방 | `MyRegistrationCard` / `CancelButton` RLS | NO | YES | — | CODE-PASS | RPC가 아니라 table UPDATE. 종료일 지난 일정은 취소 버튼 숨김 |
| S01 | Member | party 신청 | accepted 친구 | 동행 선택 후 신청 | 전원 pending, 동일 `party_id` | `create_party_registration` | PARTIAL (`participant-party.test.ts`) | YES | — | CODE-PASS | ALL OR NOTHING verified. 정원 부족 시 `Event is full`로 전체 rollback. 부분 registration 없음 |
| S02 | Member | 정원 초과 차단 | 정원 가득 | 신청 | UI 마감 + DB `Event is full` | `canApply` + `check_event_capacity` | PARTIAL (`event-status.test.ts`) | YES | — | CODE-PASS | UI와 DB 이중 |
| S03 | Member | 마감 이후 신청 | deadline 지남 | UI 신청 불가 | 마감 메시지 | UI + `POST /api/events/[id]/register` + 두 RPC | PARTIAL (`event-status.test.ts`) | YES | **P0** | **FIXED_LOCAL / AWAITING_PRODUCTION** | `registration_deadline < CURRENT_DATE`, `recruitment_closed`, `status=cancelled`를 API/RPC에서 차단. Production DB unchanged |
| S04 | Member | 타인 이벤트 수정 | 다른 사람 이벤트 | `/events/[id]/edit` | 상세로 redirect | `edit/page.tsx` owner 체크 + middleware 로그인 | NO | YES | — | CODE-PASS | RLS `is_gym_owner`도 INSERT/UPDATE 차단 |
| S05 | Member | 타인 신청 승인 | 남의 registration | RPC 호출 | `NOT_EVENT_OWNER` | `update_registration_status` | NO | YES | — | CODE-PASS | 앱 UI는 호스트 목록에만 버튼 |
| S06 | Guest | 보호 페이지 | 로그아웃 | `/my`, `/host`, `/events/new` | `/login?redirect=` | `middleware.ts` | PARTIAL (`bottom-nav.test.ts`) | YES | P1 | CODE-RISK | **`/gym/[id]`도 로그인 필수** — 문서상 공개와 불일치 |
| S07 | Member | 관심 이벤트 토글 | 로그인 | 하트 | insert/delete `event_interests` | `POST /api/events/[id]/interest` | PARTIAL (`interest-display.test.ts`) | YES | — | CODE-PASS | 실패 시 500 + raw message |
| S08 | Member | 관심 체육관 토글 | 로그인 | 하트 | `gym_follows` | `POST /api/gyms/[id]/interest` | PARTIAL | YES | P1 | CODE-RISK | 상세(`/gym/[id]`)는 로그인 후에만 |
| S09 | Member | 친구 검색 | 로그인 | `/my/friends` | `search_profiles` | `FriendUserSearch` | PARTIAL (`friend-search.test.ts`) | YES | — | CODE-PASS | 로그아웃 프로필 `/users/[id]`는 로그인 redirect |
| S10 | Guest/Member | participant preview privacy | 이벤트 상세 | 미리보기 | anon RPC 없음, 로그인 후 approved-only | `getEventParticipantPreview` | PARTIAL (`participant-preview.test.ts`) | YES | — | CODE-PASS | PR #5 의도 유지 |
| H04 | Host | 이벤트 생성 | gym owner | `/events/new` 제출 | events row 생성 | `EventForm` insert payload에 **`address` 포함** | PARTIAL (`event-location.test.ts`) | YES | **P0** | **FIXED_LOCAL / AWAITING_PRODUCTION** | Local: nullable `public.events.address` added (`20260820130838_add_event_address.sql`). No backfill. Production DB unchanged until separate migration approval |
| H05 | Host | 이벤트 수정 | 본인 이벤트 | `/events/[id]/edit` | 저장 | 동일 payload | PARTIAL | YES | **P0** | **FIXED_LOCAL / AWAITING_PRODUCTION** | H04와 동일 |
| N01 | Member | 알림 | 신청/공지 발생 | `/my/notifications` | 목록 | trigger + `NotificationList` | NO | YES | — | CODE-PASS | 조회 실패 시 빈 목록 (`error` → `[]`) |
| V01 | Member | visibility | 로그인 | `/my/settings/privacy` | 설정 저장 | `ProfileVisibilitySettingsForm` | PARTIAL (`profile-visibility.test.ts`) | YES | — | CODE-PASS | preview/프로필 마스킹에 사용 |

---

## 4. P0 Golden Path summary

| ID | Result | Manual still required |
|----|--------|------------------------|
| G01 | CODE-PASS | YES |
| G02 | MANUAL ENV QA / UNKNOWN | YES — hosted Confirm email 설정·메일 발송은 수동 확인 |
| G03 | CODE-PASS | YES — G02 이후 |
| G04 | CODE-PASS | YES |
| G05 | CODE-PASS | YES |
| G06 | CODE-PASS | YES |
| G07 | CODE-PASS | YES |
| H01 | CODE-PASS | YES |
| H02 | CODE-PASS | YES — 사전 시드 이벤트 필요 |
| H03 | CODE-PASS | YES |
| G08 | CODE-PASS | YES |
| G09 | CODE-PASS | YES |

게스트 Golden Path는 **기존 공개 이벤트가 있으면** 코드상 진행 가능하다.  
H04/H05 `events.address` drift는 local schema에서 해제됨 (`FIXED_LOCAL / AWAITING_PRODUCTION`). Production 반영은 PR merge와 별도 migration 승인 후에만 한다.

---

## 5. State audit (loading / empty / error / unauthorized / not found)

| Screen | loading | empty | error | unauthorized | not found |
|--------|---------|-------|-------|--------------|-----------|
| 홈 | Suspense spinner (섹션) | 빈 리스트에 가깝게 침묵 | 이벤트 fetch 실패 시 empty로 흡수 | — | — |
| 이벤트 목록 | `LoadingSpinner` (page Suspense) | EmptyState | Alert | — | — |
| 체육관 목록 | 동일 | EmptyState | Alert | — | — |
| 이벤트 상세 | 서버 렌더 (페이지급 spinner 약함) | — | getEvent 실패 `notFound()` | 신청은 로그인 CTA | `notFound()` |
| 체육관 상세 | — | 예정 이벤트 EmptyState | gym 없으면 notFound | **미로그인 시 login redirect** | notFound |
| 내 신청 | — | EmptyState + 이벤트 찾기 | query error 무시 → empty | middleware | — |
| host 참가자 | Suspense | 일정 없음 / 신청자 EmptyState | 일부 silent 0 | middleware | gym/event 쿼리 없으면 빈 선택 |
| 관심 | “불러오는 중” | 이벤트/체육관 각각 empty 문구 | 관심 API 500 raw | middleware | — |
| 친구 | — | empty 안내 문구 | 검색 결과 없음 | middleware | — |
| 알림 | 읽음 처리 중 | “새로운 알림이 없습니다” | 조회 실패 empty | middleware | — |
| 로그인/회원가입 | 버튼 disabled + 문구 | — | Alert | — | — |

빈 상태 자체는 주요 리스트에 있다. **홈 모집 이벤트와 내 신청/알림의 query error는 실패가 empty로 보인다.**

---

## 6. Mobile risks (375×812 / 390×844, 코드 기준)

수정하지 않음. 기록만.

| Area | Risk | Level |
|------|------|-------|
| Bottom nav | `h-16` + `safe-area-inset-bottom`, `MainShell pb-24` — 홈/이벤트/마이/내체육관만 표시 | P2 |
| Event cards | `max-w-lg` 단일 컬럼. 긴 제목은 truncate 없는 카드 있음 | P2 |
| Event detail CTA | 신청 폼이 상세 하단에 길어 스크롤 후 CTA. 하단 고정 CTA 아님 | P1 |
| Registration form | select/textarea + 가상키보드. `py-2` 입력은 닿을 만함. 완료 후 `alert`는 모바일에서 거슬림 | P2 |
| Host participant | 목록 승인/거절 버튼 2열. bulk 바 `fixed bottom-16` — 해당 페이지는 bottom nav 없음 | P1 |
| Modal/dialog | 네이티브 `confirm`/`alert`만 사용 | P2 |
| Long text | 공지/안전 정보 wrap. 카드 가로 overflow 위험은 낮음 | P2 |
| Signup | 필드가 매우 김. 10대 연락처·운영자 체육관 섹션 | P1 |
| Header | sticky, 로그인 pill | P2 |

실기기 Preview 확인이 없다. 위는 레이아웃 클래스 기준 추정.

---

## 7. Automated coverage

| Kind | Present |
|------|---------|
| Unit (Vitest) | YES — `lib/utils/*.test.ts`, `lib/constants/*.test.ts` (42 files) |
| Integration (DB/API) | NO in CI. Local SQL은 이전 High Risk PR에서 수동 수행 |
| E2E | NO |
| Playwright | **NO** |
| Cypress | **NO** |

Golden Path automated:

| ID | Coverage |
|----|----------|
| G01 | PARTIAL |
| G02 | PARTIAL |
| G03 | PARTIAL |
| G04 | PARTIAL |
| G05 | NO |
| G06 | PARTIAL |
| G07 | NO |
| H01 | PARTIAL |
| H02 | PARTIAL |
| H03 | NO |
| G08 | NO |
| G09 | NO |

이번 단계에서 Playwright를 설치하지 않는다.

---

## 8. Error handling notes

- 참가 신청: HTTP 400 + 한글 매핑. `Event is full` 매핑됨. double submit은 `loading` disable.
- 신청 fallback: RPC 부재/enum 오류일 때만 pending insert. capacity trigger는 유지.
- 승인/거절: `updateError.message` 원문 노출 가능 (P1).
- 관심 API: Supabase message 그대로 500 (P1).
- `get_event_registration_counts` 실패: `console.error` 후 정원 0 (P1, 마감/모집중 오표시).
- `getUserRegistrations` / 홈 이벤트: error 삼키고 빈 UI.
- 마감일: UI만 막고 API는 통과 (S03).
- 중복 신청: RPC `ALREADY_REGISTERED` + unique index (pending/approved).
- race: 정원 직전 동시 신청은 trigger가 막음. party 부분 성공은 S01.

---

## 9. Security regression (code / local, Production 미실행)

| Control | Finding |
|---------|---------|
| gym private contact | `PUBLIC_GYM_SELECT`에 대표 연락처 없음. 호스트만 `gym_private_contacts` | PASS |
| participant preview anon | 미로그인 RPC 호출 안 함 | PASS |
| authenticated-only RPC anon | PR #7 revoke. 앱 로그아웃 경로는 해당 RPC 미호출 | PASS (코드) |
| public event counts | batch RPC 유지, singular DROP (PR #9) | PASS |
| nickname availability anon | signup check/suggest | PASS |
| manual approval | pending insert, auto_approve 폼 제거 | PASS |
| `/gym/[id]` | 미로그인 차단 — 공개 상세보다 보수적. PII 유출은 줄고 탐색 UX는 깎임 | 제품 불일치 (P1) |

---

## 10. Issue lists

### P0

1. **Host 이벤트 생성/수정 payload `events.address`** — **FIXED_LOCAL / AWAITING_PRODUCTION**. Local에 nullable `public.events.address`를 추가해 EventForm / Event type과 정렬했다. 기존 row는 backfill 없이 `address = null`로 유효하다. Production DB는 이 PR만으로 변경되지 않는다.
2. **registration_deadline / recruitment_closed / cancelled 서버 가드** — **FIXED_LOCAL / AWAITING_PRODUCTION**. UI뿐 아니라 `POST /api/events/[id]/register`와 `create_solo_registration` / `create_party_registration`에서 신청을 차단한다. Production DB unchanged until separate migration approval.

### MANUAL ENV QA

1. **회원가입 이메일 인증** — P0 code bug가 아니다. signup code supports no-session / email-confirmation flow. Hosted Supabase Confirm email setting must be checked manually. Confirmation email delivery must be tested before external beta. Hosted Confirm email = UNKNOWN. Auth 설정은 임의로 ON/OFF 하지 않는다.

### P1

1. 로그아웃 시 체육관 상세 `/gym/[id]` 로그인 강제 (`middleware` `startsWith("/gym/")`). 목록은 공개.
2. 공개 프로필 `/users/[id]`도 로그인 redirect.
3. 공개 정원 RPC 실패 시 0명으로 표시.
4. 일부 목록 query 실패 = empty.
5. Host 승인 오류가 RPC 영문 원문.
6. 이벤트 상세 신청 CTA가 화면 하단 스크롤 뒤에 있음.
7. 회원가입 폼이 매우 길어 모바일에서 이탈 가능.

### P2

1. 신청 완료 `window.alert`.
2. `docs/ROUTES.md`가 체육관 상세·닉네임 API method를 실제와 다르게 기술.
3. Bottom nav가 상세/신청/호스트 참가자 페이지에 없음 (의도일 수 있음).
4. 알림 읽음 실패 시 UI 피드백 없음.

---

## 11. STEP 4-2 / 4-5A status

STEP 4-2 완료 (local):

1. nullable `public.events.address` migration 추가. EventForm / Event type과 local schema 정렬.
2. 기존 이벤트 backfill 없음. `address = null` row 조회 가능.
3. Production DB / hosted Auth 설정 변경 없음.

STEP 4-5A 완료 (local):

1. `POST /api/events/[id]/register`가 deadline / `recruitment_closed` / `status=cancelled`를 RPC 호출 전에 검사.
2. `create_solo_registration` / `create_party_registration`에 동일 invariant. Direct RPC bypass도 차단.
3. party 정원 부족은 ALL OR NOTHING verified.
4. Production DB unchanged. PR merge와 Production migration 승인은 별도.

다음 (Production 반영은 별도 승인):

1. PR review → merge → Founder Production migration 승인 → manual `db push` → Production smoke.
2. Hosted Confirm email ON/OFF 기록. 테스터 안내문 작성 (메일 인증 / 테스트 계정 지급).
3. 수동 Golden Path 스크립트: 위 G01–G09를 Preview에서 체크리스트로 실행. Playwright 설치는 그 다음.
4. P1 중 테스트 당일 UX: 체육관 상세 로그인 벽은 testers에게 “체육관 탭은 목록까지, 상세는 로그인”으로 안내하거나, Founder가 공개 여부 결정.
5. error-state / count fallback은 별도 PR.

이번 단계에서는 Playwright를 설치하지 않았다.

---

## 12. Email Auth — code audit only (no hosted setting change)

| Item | Repo finding |
|------|----------------|
| Signup no-session UX | `POST /api/auth/signup` returns `hasSession: false`, `needsEmailConfirmation: true` when Auth does not issue a session. `app/signup/page.tsx` shows email-confirmation copy instead of redirecting home |
| Login | `LoginForm` uses `signInWithPassword` |
| Auth callback | `app/auth/callback/route.ts` exists and calls `exchangeCodeForSession` |
| Local Site URL | `supabase/config.toml` `site_url = "http://127.0.0.1:3000"`; `additional_redirect_urls = ["https://127.0.0.1:3000"]` |
| App Site URL fallback | `NEXT_PUBLIC_SITE_URL` default `https://openhouse-gilt.vercel.app` (`app/layout.tsx`) |
| Password recover redirect | `/auth/callback?next=/login/reset-password` (`RecoverForm`) |
| Local confirmations | `supabase/config.toml` `[auth.email] enable_confirmations = false` (local only) |
| Hosted Confirm email | **UNKNOWN** — do not change hosted Auth settings from this task |

Hosted Site URL / Redirect URL allow-list cannot be confirmed from the repo. Leave UNKNOWN.
