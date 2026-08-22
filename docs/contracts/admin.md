# Admin panel (Closed Beta)

운영자 전용 `/admin` 조회·최소 처리 계약.

## Auth

- 로그인된 사용자만 접근.
- `public.admin_users.user_id`에 있는 사용자만 admin.
- Next.js `app/admin/layout.tsx`에서 `is_admin()` 검사.
- middleware는 로그인 여부만 확인. admin 여부는 layout + RLS가 담당.

## `is_admin()`

- `SECURITY DEFINER`, `search_path = ''`
- `auth.uid()`가 `admin_users`에 있으면 true
- `authenticated` execute만 허용. 본인 여부 boolean만 반환.

## 입력 / 출력

### PATCH `/api/admin/inquiries/[id]`

입력: `{ status?: open|answered|closed, adminReply?: string }`  
- `status`가 있으면 allowlist만 허용. 그 외 HTTP 400.
- `adminReply`는 string만. 최대 5000자. 초과 시 HTTP 400.
출력: `{ ok: true }` 또는 `{ error }` (DB 내부 메시지는 노출하지 않음)  
권한: admin  
부수효과: `inquiries.status`, `inquiries.admin_reply` 갱신. 트리거가 `admin_action_logs`에 `inquiry.update` 1건 기록.

### PATCH `/api/admin/reports/[id]`

입력: `{ status: received|reviewing|resolved }`  
- allowlist 밖이면 HTTP 400.
- `reviewing`이면 `resolved_at = null`. `resolved`이면 `resolved_at = now()`.
출력: `{ ok: true }` 또는 `{ error }` (DB 내부 메시지는 노출하지 않음)  
권한: admin  
부수효과: `reports.status`, `resolved_at`. 트리거가 `report.update` 1건 기록.

## 조회

문의/신고 본문은 admin SELECT RLS로 읽는다. 디렉터리 조회는 table SELECT가 아니라 RPC다.

| RPC | 반환 |
|-----|------|
| `admin_get_overview()` | 집계 7개 |
| `admin_get_users(search)` | id, nickname, display_name, created_at, is_operator, application_count |
| `admin_get_gyms(search)` | id, name, sport, region, is_public, created_at, owner_label, upcoming_event_count |
| `admin_get_events(search, p_status)` | id, title, event_date, status, gym_name, host_label, application_count |
| `admin_get_event_detail(event_id)` | 검수용 이벤트 필드 + `is_publicly_viewable`. 민감 연락처/메모 없음 |
| `admin_get_profile_labels(user_ids)` | id, nickname, display_name |
| `admin_get_event_titles(event_ids)` | id, title |

반환 금지: `phone`, `parent_phone`, `pending_gym_info`, `emergency_contact`, `applicant_notes`, `operator_memo`.

이벤트 목록 링크는 `/admin/events/{id}`다. `/events/{id}`는 `is_publicly_viewable`일 때만 보조 링크로 제공한다. 상세는 read-only.

비관리자가 RPC를 호출하면 exception.

## Audit

`admin_action_logs.admin_user_id`는 nullable이며 `auth.users(id) ON DELETE SET NULL`.
`admin_users`에서 권한을 제거해도 과거 로그는 남는다.

## 하지 않음

회원 정지/삭제, 체육관/이벤트 강제 삭제, 자동 패널티, service_role 브라우저 노출.

## 관리자 등록

Migration은 `admin_users`를 비워 둔다. SQL Editor에서:

```sql
insert into public.admin_users (user_id)
values ('<auth.users.id>');
```
