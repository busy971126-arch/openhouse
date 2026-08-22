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
출력: `{ ok: true }`  
권한: admin  
부수효과: `inquiries.status`, `inquiries.admin_reply` 갱신. 트리거가 `admin_action_logs`에 `inquiry.update` 기록.

### PATCH `/api/admin/reports/[id]`

입력: `{ status: received|reviewing|resolved }`  
출력: `{ ok: true }`  
권한: admin  
부수효과: `reports.status`, `resolved_at`. 트리거가 `report.update` 기록.

## 조회

Admin SELECT는 RLS `is_admin()`으로 허용.

- inquiries / reports: 전체
- gyms / events: 비공개·draft 포함
- profiles: 목록용. 화면에는 닉네임·표시 이름·가입일만
- registrations: 집계만

## 하지 않음

회원 정지/삭제, 체육관/이벤트 강제 삭제, 자동 패널티, service_role 브라우저 노출.

## 관리자 등록

Migration은 `admin_users`를 비워 둔다. SQL Editor에서:

```sql
insert into public.admin_users (user_id)
values ('<auth.users.id>');
```
