# Intentional SECURITY DEFINER exceptions

Reviewed: 2026-08-20

This file records **reviewed and accepted** Security Advisor exceptions.
It is **not** a Security Advisor warning-suppression mechanism.
Warnings may still appear in the advisor; they remain accepted until the
revisit conditions below are met.

---

## get_event_registration_counts(uuid[])

Purpose:
공개 이벤트의 현재 참가 인원
(pending + approved) 집계 제공.

Why anon:
로그아웃 홈 / 이벤트 목록 / 이벤트 상세에서
정원 및 모집 상태 표시 필요.

Why SECURITY DEFINER:
registrations는 anon SELECT 불가.
개별 registration 데이터는 공개하지 않고
event_id + aggregate count만 반환.

Returned data:
- event_id
- aggregate participant count

Accepted risk:
Supabase Security Advisor
anon/authenticated SECURITY DEFINER warning을
의도적 예외로 허용.

Revisit when:
공개 count를 service-role API / 별도 public aggregate
구조로 이전할 때.

---

## is_nickname_available(text)

Purpose:
회원가입 전 닉네임 중복 여부 확인.

Why anon:
가입 전 사용자가 로그인하지 않은 상태에서 필요.

Why SECURITY DEFINER:
profiles 전체 SELECT를 anon에게 공개하지 않고
boolean availability만 반환하기 위함.

Returned data:
boolean only.

Input validation:
2~20자 validation 존재.

Accepted risk:
닉네임 존재 여부 probing 가능성은 있지만
전체 profile 데이터 공개보다 최소 권한 방식으로 판단.

Revisit when:
서버 전용 service_role API + rate limiting 구조로
이전할 때.

---

## is_admin()

Purpose:
현재 세션 사용자가 `admin_users`에 있는지 boolean으로 확인.

Why authenticated:
`/admin` server guard와 admin RLS 정책이 동일 함수를 사용.

Why SECURITY DEFINER:
`admin_users`를 일반 SELECT로 열지 않고 존재 여부만 반환.

Returned data:
boolean only. `search_path = ''`.

Why not anon:
로그인 사용자만 execute.

Accepted risk:
본인이 admin인지 probing 가능. admin 목록/이메일은 노출하지 않음.

Revisit when:
서버 전용 admin session claim으로 이전할 때.
