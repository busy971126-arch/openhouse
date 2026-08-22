# OpenHouse Decision Log

OpenHouse의 중요한 제품·기술 결정을 기록한다.

이 문서는 **현재 상태를 설명하는 문서가 아니라, 왜 그렇게 결정했는지** 남기는 문서다. 현재 기능 범위는 [`PROJECT.md`](../PROJECT.md), 실제 구현은 코드/DB 문서를 기준으로 한다.

---

## 기록 규칙

각 결정은 다음 형식을 사용한다.

- Status: `Accepted` / `Superseded` / `Deprecated`
- Recorded: 기록일
- Decision: 무엇을 결정했는가
- Why: 왜 그렇게 했는가
- Consequence: 어떤 영향이 있는가

기존 결정을 바꿀 때 이전 내용을 삭제하지 않고 `Superseded`로 남긴다.

---

## D-001 — 유도로 MVP 시작

- Status: Accepted
- Recorded: 2026-08-22

### Decision

OpenHouse의 초기 MVP는 유도 이벤트와 체육관을 중심으로 검증한다. 구조는 다른 종목으로 확장 가능하게 유지한다.

### Why

첫 시장을 좁혀 실제 참가자·주최자 문제를 빠르게 검증하면서도 장기적으로 주짓수, 레슬링, MMA, 복싱, 클라이밍, 러닝 등으로 확장하기 위해서다.

### Consequence

미래 종목 확장을 이유로 현재 유도 MVP를 복잡하게 만들지 않는다.

---

## D-002 — 웹 MVP 우선

- Status: Accepted
- Recorded: 2026-08-22

### Decision

초기 검증은 웹 MVP로 진행한다. iOS/Android 앱은 핵심 가설 검증 이후 검토한다.

### Why

배포와 수정 속도를 높이고 앱 스토어 배포 비용 없이 사용자 반응을 확인하기 위해서다.

---

## D-003 — 핵심 검증 루프 우선

- Status: Accepted
- Recorded: 2026-08-22

### Decision

MVP의 최우선 흐름은 다음이다.

```text
회원가입
→ 이벤트 찾기
→ 이벤트 상세
→ 참가 신청
→ 주최자의 참가자 관리
```

### Why

OpenHouse가 해결하려는 가장 중요한 참가자/주최자 문제를 최소 기능으로 검증하기 위해서다.

### Consequence

친구, 추천, 후기, 결제 등 부가 기능이 이미 구현되어 있더라도 핵심 루프보다 개발 우선순위가 높지 않다.

---

## D-004 — 별도 Host 계정을 만들지 않음

- Status: Accepted
- Recorded: 2026-08-22

### Decision

일반 계정과 Host 계정을 분리하지 않는다. 체육관 owner 권한을 가진 사용자가 Host 기능을 사용한다.

### Why

하나의 사용자가 참가자이면서 동시에 운영자일 수 있고, 계정 체계를 이중화하면 가입과 권한 모델이 복잡해지기 때문이다.

---

## D-005 — 운영 대시보드보다 마이페이지 중심

- Status: Accepted
- Recorded: 2026-08-22

### Decision

개인 활동은 `/my` 계열을 중심으로 구성한다. 별도 `/dashboard`는 독립 제품 영역으로 키우지 않고 현재 route 정책에 따라 마이페이지 쪽으로 연결한다.

### Why

MVP에서 참가자/주최자 UI를 불필요하게 이중화하지 않기 위해서다.

### Consequence

Host 전용 복잡한 통계 대시보드보다 내 체육관·이벤트·참가자 관리 진입을 우선한다.

---

## D-006 — `찜` 대신 `관심`

- Status: Accepted
- Recorded: 2026-08-22

### Decision

UI/문서 용어는 `찜` 대신 `관심`으로 통일한다.

- 관심 체육관 → `gym_follows`
- 관심 이벤트 → `event_interests`

### Why

서비스 전체에서 중립적이고 일관된 표현을 사용하기 위해서다.

### Consequence

관심등록은 참가 신청과 별개의 행동이며 정원에 영향을 주지 않는다.

---

## D-007 — 현재 참가 신청은 수동 승인 모델

- Status: Accepted
- Recorded: 2026-08-22

### Decision

핵심 신청 흐름은 `pending → host 승인 → approved/rejected`를 기준으로 한다.

### Why

초기 운영자가 참가자를 확인하고 통제할 수 있는 단순하고 명확한 모델을 유지하기 위해서다.

### Consequence

자동 승인 로직을 추가/복원할 때는 제품 결정, DB, 테스트 기준을 함께 갱신해야 한다.

---

## D-008 — GitHub가 Single Source of Truth

- Status: Accepted
- Recorded: 2026-08-22

### Decision

ChatGPT/Cursor 대화 자체가 아니라 GitHub에 저장된 문서·코드·migration을 공식 프로젝트 상태로 본다.

### Why

AI 도구가 바뀌거나 대화가 끊겨도 같은 프로젝트 기준을 유지하기 위해서다.

### Consequence

중요한 결정은 문서에 반영되어야 하며, GitHub에 없는 대화 합의는 공식 결정으로 간주하지 않는다.

---

## D-009 — 일반 개발은 working branch 사용

- Status: Accepted
- Recorded: 2026-08-22

### Decision

기능/버그/문서 작업은 `main`에서 직접 개발하지 않고 working branch를 사용한다.

권장 prefix:

- `feat/`
- `fix/`
- `docs/`
- `refactor/`
- `chore/`

### Why

AI 변경을 Preview/Review 후 승인할 수 있는 Harness를 만들기 위해서다.

---

## D-010 — Production DB 직접 수정 금지

- Status: Accepted
- Recorded: 2026-08-22

### Decision

AI가 Production DB를 독단적으로 수정하지 않는다. Schema 변경은 새 migration으로 기록한다.

### Why

데이터 손실, 환경 drift, 복구 불가능한 변경을 막기 위해서다.

### Consequence

기존 migration 파일을 수정하기보다 새 migration을 추가하며, High Risk 변경은 별도 검증 절차를 따른다.

---

## D-011 — Knowledge Base 역할 분리

- Status: Accepted
- Recorded: 2026-08-22

### Decision

하나의 거대한 문서에 모든 정보를 넣지 않고 다음 책임으로 분리한다.

- `PROJECT.md` — 비전/범위
- `PRODUCT.md` — 사용자 동작
- `ROUTES.md` — 화면/URL
- `DATABASE.md` — 데이터
- `DESIGN.md` — UI/UX
- `TESTING.md` — 검증 전략
- `DECISIONS.md` — 결정 이유
- `AGENTS.md` — AI governance

### Why

중복된 정보가 서로 다른 상태로 남아 AI가 잘못된 문서를 참고하는 문제를 줄이기 위해서다.

---

## D-012 — 구현된 MVP+와 개발 우선순위를 구분

- Status: Accepted
- Recorded: 2026-08-22

### Decision

현재 코드에 존재하는 기능과 앞으로 개발 우선순위가 높은 기능을 같은 의미로 보지 않는다.

### Why

OpenHouse에는 관심등록, 친구, 동행 신청 등 핵심 루프 밖의 기능도 이미 존재한다. 구현되어 있다는 이유만으로 추가 고도화를 계속하면 사용자 검증보다 범위가 커질 수 있다.

### Consequence

새 작업은 항상 `PROJECT.md`의 MVP/MVP+/Beta 분류와 실제 사용자 문제를 먼저 확인한다.
