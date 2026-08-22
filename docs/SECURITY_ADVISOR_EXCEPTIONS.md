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

---

## admin_get_overview / admin_get_users / admin_get_gyms / admin_get_events

Purpose:
Closed Beta admin 디렉터리 조회. profiles/gyms/events/registrations 전체 SELECT RLS를 열지 않기 위함.

Why authenticated:
로그인한 admin JWT만 호출. 함수 시작 시 `is_admin()`이 아니면 exception.

Why SECURITY DEFINER:
admin이 아닌 사용자에게 해당 테이블 SELECT를 주지 않고 화면용 컬럼/집계만 반환.

Returned data:
집계 또는 nickname/display_name/title 등 디렉터리 필드만.
`phone`, `parent_phone`, `pending_gym_info`, `emergency_contact`, `applicant_notes`, `operator_memo` 미반환.
`search_path = ''`. 테이블은 `public.xxx`로 명시.

Why not anon:
로그인 사용자만 execute.

Accepted risk:
authenticated SECURITY DEFINER. 비관리자 호출은 exception.

Revisit when:
서버 전용 admin API로 이전할 때.

---

## admin_get_profile_labels / admin_get_event_titles

Purpose:
문의/신고 화면에서 닉네임·이벤트 제목만 표시. profile/event 전체 SELECT RLS 없이 라벨 조회.

Why authenticated / SECURITY DEFINER:
위 디렉터리 RPC와 동일. `is_admin()` 필수.

Returned data:
`id, nickname, display_name` 또는 `id, title`만.

Revisit when:
서버 전용 admin API로 이전할 때.

---

## admin_get_event_detail(uuid)

Purpose:
Closed Beta admin이 타인이 만든 draft / 비공개 체육관 이벤트를 검수. public `/events/{id}` RLS를 완화하지 않음.

Why authenticated / SECURITY DEFINER:
events 전체 SELECT RLS를 다시 열지 않고 검수용 컬럼만 반환. `is_admin()` 필수.

Returned data:
title, schedule, gym/host labels, application count, description, `is_publicly_viewable`.
Phase 1 이후에는 `admin_hidden_at`, `admin_recruitment_paused_at`와, 로그에서 읽은 `last_moderation_reason`만 포함. admin UUID는 반환하지 않음.
`emergency_contact`, 참가자 개인정보, `applicant_notes`, `operator_memo` 미반환.

Revisit when:
서버 전용 admin API로 이전할 때.

---

## admin_get_applications / admin_get_application_detail / admin_get_activity / admin_moderate_event

Purpose:
Control Center Phase 1. 신청 모니터링, 운영 피드, 이벤트 숨김/신청 중지.
profiles/registrations/events 전체 SELECT RLS와 events UPDATE를 admin JWT에 주지 않기 위함.

Why authenticated / SECURITY DEFINER:
함수 시작 시 `is_admin()`이 아니면 exception.
`search_path = ''`. 테이블은 `public.xxx`로 명시.

Returned data:
- applications: id, created_at, status, participant_label, event/gym labels
- activity: occurred_at, actor_type, action, target ids
- moderate: void. audit log + operational_activity 1건씩

Why not anon:
로그인 사용자만 execute.

Accepted risk:
authenticated SECURITY DEFINER. 비관리자 호출은 exception.
`admin_moderate_event`만 events.admin_* 컬럼을 바꾼다.

Revisit when:
서버 전용 admin API로 이전할 때.
