# OpenHouse Testing Strategy

OpenHouse에서 **무엇을 어떤 순서로 검증해야 완료로 보는지** 정의한다.

현재 QA 감사 결과와 알려진 위험은 [`USER_TEST_QA.md`](./USER_TEST_QA.md)를 기준으로 한다. 이 문서는 특정 시점의 감사 결과가 아니라 지속적으로 적용할 테스트 원칙을 정의한다.

---

## 1. 테스트 목표

테스트의 목적은 코드 커버리지 숫자를 높이는 것이 아니라 다음 실패를 막는 것이다.

- 회원가입/로그인이 막힘
- 이벤트를 찾을 수 없음
- 참가 신청이 저장되지 않음
- 정원/마감 조건이 무시됨
- Host가 신청자를 승인하지 못함
- 다른 사용자의 데이터에 접근 가능
- UI 변경 때문에 기존 Golden Path가 깨짐
- Production 반영 후 핵심 기능이 동작하지 않음

---

## 2. 핵심 Golden Path

### Participant

```text
회원가입/로그인
→ 이벤트 목록
→ 이벤트 상세
→ 참가 신청
→ 신청 완료
→ 내 참가에서 pending 확인
→ Host 승인
→ approved 확인
→ 필요 시 참가 취소
```

### Host

```text
로그인
→ 내 체육관
→ 이벤트 생성/수정
→ 참가자 목록
→ pending 신청 확인
→ 승인/거절
→ 참가 현황 확인
```

MVP 배포 전에는 이 두 흐름이 반드시 검증되어야 한다.

---

## 3. 테스트 레이어

### Layer 1 — Static / Build

모든 일반 변경에서 확인한다.

- TypeScript 오류 없음
- lint 오류 없음
- production build 가능

프로젝트 script가 변경되면 실제 `package.json` 기준 명령을 사용한다.

### Layer 2 — Unit / Logic

Vitest로 상태 계산, 에러 매핑, 데이터 변환, 권한 보조 로직 등 브라우저 없이 검증 가능한 로직을 테스트한다.

특히 다음은 unit test 우선 대상이다.

- 모집 상태 계산
- 정원 계산
- 신청 상태 표시
- 날짜/마감 로직
- API error mapping
- 데이터 fallback

### Layer 3 — Integration / DB

DB, RPC, RLS가 관련된 변경은 UI만 확인하지 않는다.

검증 대상 예:

- 신청 insert/RPC
- 정원 초과 방지
- 중복 신청 방지
- Host owner 권한
- 타인 승인 차단
- profile privacy
- migration 적용 가능 여부

Production 데이터로 테스트하지 않는다.

### Layer 4 — E2E

사용자 브라우저 흐름을 자동 검증한다.

목표 도구: **Playwright**.

현재 `USER_TEST_QA.md` 기준으로 Playwright/Cypress E2E 프레임워크는 아직 없다. 도입 전까지 핵심 흐름은 수동 Preview QA가 필수다.

### Layer 5 — Preview Manual QA

Normal/High Risk 변경은 Vercel Preview에서 Founder가 실제 화면을 확인한다.

확인 항목:

- 모바일
- 주요 CTA
- Loading
- Empty
- Error
- 권한
- 변경 기능
- 기존 Golden Path 회귀

### Layer 6 — Production Smoke Test

Production 반영 직후 짧게 확인한다.

- 서비스 접근 가능
- 로그인 가능
- 핵심 페이지 접근 가능
- 변경 기능 정상
- 심각한 오류 없음

---

## 4. Risk별 최소 테스트

| Risk | 예시 | 최소 검증 |
|---|---|---|
| Low | 문서, 오타, 주석 | 링크/내용 검토 |
| Normal | UI, form, 사용자 흐름, API | build + 관련 unit + Preview 수동 QA |
| High | DB schema, RLS, Auth, 개인정보, 삭제 | build + unit + DB/integration + staging/local + Preview + Founder 승인 + Production smoke |

Risk 분류와 승인 절차는 [`AGENTS.md`](../AGENTS.md)를 따른다.

---

## 5. MVP 필수 시나리오

### Auth

- 회원가입
- 이메일 인증 설정이 켜진 경우 인증 흐름
- 로그인
- 로그아웃
- 비밀번호 재설정
- 보호 route redirect

### Event Discovery

- 이벤트 목록 로드
- 검색/필터
- 이벤트 상세
- 데이터 0건
- query 실패

### Registration

- solo 신청
- 이미 신청한 사용자 재신청 차단
- 정원 마감
- 신청 마감일 경과
- 이벤트 취소
- pending 표시
- approved 표시
- rejected 표시
- 참가 취소

### Host

- 본인 이벤트 생성/수정
- 타인 이벤트 수정 차단
- 참가자 목록
- 승인
- 거절
- 타인이 승인 RPC 호출 시 차단

### Gym

- 체육관 등록/수정
- 체육관 상세
- owner 권한

### Privacy / Security

- 비로그인 접근
- 다른 사용자 데이터 접근
- profile visibility
- RLS recursion/error 없음
- admin 권한 경계(해당 변경 시)

---

## 6. E2E 도입 우선순위

Playwright를 도입할 때 처음부터 모든 화면을 자동화하지 않는다.

### P0

1. 로그인
2. 이벤트 목록/상세
3. solo 참가 신청
4. 내 참가 pending 확인
5. Host 신청자 확인
6. Host 승인
7. 참가자 approved 확인

### P1

8. 참가 취소
9. 이벤트 생성
10. 이벤트 수정
11. 정원 마감
12. 신청 마감
13. 체육관 등록/수정

### P2

14. 관심등록
15. 동행 신청
16. 친구
17. 알림
18. privacy 설정

---

## 7. 버그 수정 완료 기준

버그를 수정했다고 말하려면 다음을 남긴다.

1. 재현 조건
2. 원인
3. 수정 내용
4. 회귀 가능 영역
5. 추가/수정한 테스트
6. 실행한 테스트와 결과
7. 수동 확인이 남았는지

테스트하지 못한 항목을 `pass`로 표현하지 않는다.

---

## 8. 기능 완료 Definition of Done

기능은 코드 작성만으로 완료되지 않는다.

- 요구사항과 실제 동작이 일치
- 관련 문서 갱신
- 권한/예외 처리 확인
- 관련 unit/integration test 통과
- 필요한 경우 Preview QA 완료
- DB 변경 시 migration 기록
- 알려진 미검증 항목 명시
- Founder 승인 필요 단계 통과

---

## 9. QA 기록 위치

- 지속적인 테스트 원칙 → `docs/TESTING.md`
- 특정 시점 전체 QA 감사 → `docs/USER_TEST_QA.md`
- 기능별 Frontend/Backend 계약 → `docs/contracts/*.md`
- test code → 실제 repository test 파일
- schema 검증 → `supabase/migrations/` + `docs/DATABASE.md`

동일 테스트 결과를 여러 문서에 복제하지 않는다.
