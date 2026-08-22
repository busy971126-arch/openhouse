# OpenHouse Admin Control Center — Phase 1

## Goal

Turn the Closed Beta admin panel from a read-oriented dashboard into a practical operations control center.

Phase 1 focuses on four areas only:

1. Operations-focused Overview
2. Applications monitoring
3. Reversible Event admin actions
4. Richer Recent Activity

Do not add broad destructive powers, user suspension, gym deletion, payments, claim workflow, or broadcast notifications in this phase.

---

## Product principles

Admin flow should follow:

**observe → understand → intervene safely → leave an audit trail**

Rules:

- Keep admin authentication as server guard + Supabase RLS/RPC.
- Do not expose service_role to browser/client code.
- Prefer narrow SECURITY DEFINER RPCs over broad table SELECT RLS.
- Do not restore broad admin SELECT policies for profiles, registrations, gyms, or events.
- Admin actions must be reversible where possible.
- Do not hard-delete users, gyms, events, or registrations.
- Every admin mutation must be auditable.
- Do not expose participant private data unless directly required for an operational task.
- Preserve participant and host behavior unless explicitly changed below.
- Keep the current OpenHouse editorial admin visual language. No emoji dashboard, no generic rounded SaaS cards.

---

## 1. Overview redesign

Route: `/admin`

Replace lifetime-count-first layout with an operations-first layout.

### TODAY

Show at minimum:

- New users today (Asia/Seoul)
- Applications created today
- Events published today if reliably derivable from current data; otherwise omit rather than guess
- Active events today

### NEEDS ATTENTION

Show actionable counts with links:

- Pending applications → `/admin/applications?status=pending`
- Open inquiries → `/admin/inquiries`
- Unresolved reports → `/admin/reports`
- Draft events → `/admin/events?status=draft`

Do not treat zero-value items as errors.

### LIVE OPERATIONS

Show at minimum:

- Events happening today
- Events in the next 7 days
- Active applications total

### RECENT ACTIVITY

Show meaningful product activity, newest first, e.g.:

- registration.created
- registration.approved
- registration.cancelled
- event.created
- event.published
- event.cancelled
- admin inquiry/report/event actions

If historical event/activity instrumentation is insufficient, introduce a small append-only operational activity table or narrowly-scoped logging mechanism rather than inferring unsafe data.

Limit initial feed to ~20 rows.

---

## 2. Applications monitoring

New routes:

- `/admin/applications`
- `/admin/applications/[id]`

### List

Provide filters:

- all
- pending
- approved
- cancelled/rejected as supported by current registration_status

Display only the minimum useful fields:

- application id
- created_at
- status
- participant label (nickname/display name)
- event title
- event date
- gym name

Do not show phone/parent_phone in the list.

Support text search by participant label or event title only if it can be implemented safely through admin RPC.

### Detail

Read-only in Phase 1 unless a specific reversible admin intervention is required by the event action workflow.

Show:

- participant label
- event
- gym
- application status
- created_at
- host/owner context if useful

Private contact data should remain hidden by default. Do not add a general-purpose PII viewer.

Provide navigation links to:

- admin event detail
- public user profile only when that route is legitimately viewable

Do not add force-approve, force-reject, or force-cancel registration actions in Phase 1.

---

## 3. Event admin interventions

Existing admin route:

- `/admin/events/[id]`

Add a clearly separated `ADMIN ACTIONS` section.

Phase 1 actions must be reversible/safe.

### Required actions

Design a dedicated admin moderation state rather than overloading normal host lifecycle if needed.

At minimum support:

- Hide from public discovery
- Restore public visibility
- Pause recruitment / stop new applications
- Resume recruitment

For event cancellation, only expose an admin action if the existing cancellation propagation to registrations/notifications is already safe and fully verified. Otherwise leave admin cancellation out of Phase 1 and document why.

Do not hard-delete events.

### Data model

Prefer additive columns/table such as admin moderation metadata rather than rewriting event ownership.

Possible model (adapt to existing schema):

- admin_hidden_at timestamptz nullable
- admin_hidden_by uuid nullable
- admin_recruitment_paused_at timestamptz nullable
- admin_recruitment_paused_by uuid nullable
- admin_moderation_reason text nullable

Or a dedicated moderation table if cleaner.

Public/event discovery and registration eligibility must respect these moderation states at the database/business-rule level, not only in UI.

Host ownership must not be transferred or modified.

### Reason

Each admin intervention requires a short reason.

- trim input
- reasonable max length (e.g. 500)
- log target/event/action/reason metadata safely

Do not copy participant PII into logs.

---

## 4. Recent Activity / audit

Extend current admin logs so the operator can answer:

- what happened?
- when?
- to which event/application?
- was it a user/host action or admin intervention?

Keep existing inquiry/report audit history.

Admin event actions must add logs, for example:

- event.hide
- event.restore
- event.recruitment_pause
- event.recruitment_resume

If introducing product activity logs for registrations/events, keep them append-only and minimal.

Do not put message bodies, phone numbers, parent contact, emergency contacts, or applicant notes into logs.

---

## 5. Security

All new admin RPCs:

- SECURITY DEFINER only when required
- `set search_path = ''`
- start with explicit `public.is_admin()` validation
- fully qualify `public.xxx`
- return only allowlisted fields
- revoke PUBLIC/anon execute
- grant execute only to authenticated (and service_role if operationally required)

Admin mutations:

- server/API authorization check
- DB-level authorization check
- validate action enum and reason length
- generic client error, detailed server logging only

Do not give admin JWT broad UPDATE/DELETE on events or registrations.

Prefer dedicated RPCs for event moderation transitions.

---

## 6. Timezone

Operational daily stats must use Asia/Seoul consistently.

Do not use browser-local date for server/db counts.

---

## 7. UX

Desktop and mobile usable.

Suggested nav:

- OVERVIEW
- APPLICATIONS
- INQUIRIES
- REPORTS
- GYMS
- EVENTS
- USERS

Keep the current editorial admin chrome.

Use orange only for attention/key action.

Dangerous/restrictive admin actions must have a confirmation step and clearly describe impact.

---

## 8. Explicitly out of scope

Do not implement in Phase 1:

- user suspension/ban
- user deletion
- gym deletion
- event hard delete
- registration force approval/rejection
- payments/refunds
- claim system
- admin invitation UI
- bulk notifications/notices
- analytics charts
- multi-sport redesign
- general PII viewer

---

## 9. Required tests

At minimum verify:

- non-admin cannot call any new admin RPC/action
- non-admin cannot access `/admin/applications`
- application RPC field allowlist contains no phone/parent_phone/private notes
- KST today counts around UTC date boundary
- hidden event disappears from public discovery
- restored event returns to public discovery when otherwise eligible
- paused event cannot accept new registration
- resumed event can accept registration when otherwise eligible
- host can still view/manage own event under moderation state as intended
- every admin event transition produces exactly one audit log
- invalid transition/action rejected
- reason max length enforced
- no event hard delete path added
- existing inquiry/report admin behavior still works

Run:

- relevant Vitest tests
- relevant ESLint
- `npm run build`
- local Supabase migration/security tests if available

---

## 10. Delivery rules

Work only on `feat/admin-control-center-phase1`.

Do not merge to main.
Do not deploy Production.
Do not apply migrations to linked Production Supabase.

Local Supabase or isolated Preview is allowed.

At completion report:

1. commit SHA
2. changed files
3. migrations/data model
4. new routes
5. admin RPCs
6. event moderation rules
7. application monitoring behavior
8. activity/audit changes
9. build/test results
10. unresolved risks or deliberate omissions
