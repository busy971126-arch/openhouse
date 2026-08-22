# OpenHouse Knowledge Base

OpenHouse의 제품·개발·운영 지식을 AI와 사람이 동일한 기준으로 읽도록 만드는 문서 지도다.

> 목표: 새 작업을 시작할 때 대화 기록이 아니라 GitHub의 현재 문서를 기준으로 판단한다.

---

## 1. Single Source of Truth

OpenHouse의 공식 상태는 GitHub에 저장된 문서, 코드, migration을 기준으로 한다.

대화에서 합의했더라도 GitHub에 반영되지 않은 내용은 제안 또는 미반영 결정으로 취급한다.

---

## 2. 질문별 기준 문서

| 질문 | 우선 확인할 문서 | 역할 |
|---|---|---|
| OpenHouse가 무엇이고 지금 무엇을 검증하는가? | [`PROJECT.md`](../PROJECT.md) | 비전, 문제, MVP/MVP+/Beta 범위 |
| 사용자는 어떻게 이용해야 하는가? | [`PRODUCT.md`](./PRODUCT.md) | 사용자 흐름, 기능 동작, 상태 |
| 어떤 화면과 URL이 존재하는가? | [`ROUTES.md`](./ROUTES.md) | IA, route, API route |
| 데이터는 어떻게 저장되고 연결되는가? | [`DATABASE.md`](./DATABASE.md) | 스키마, RLS, RPC, migration 가이드 |
| AI가 Supabase의 실제 상태를 어떻게 확인하는가? | [`MCP.md`](./MCP.md) | Supabase MCP 연결, 권한, 안전 규칙 |
| ERD 이름과 실제 DB 이름은 어떻게 대응하는가? | [`ERD_V1.1_MAPPING.md`](./ERD_V1.1_MAPPING.md) | ERD ↔ 실제 테이블 매핑 |
| 화면은 어떤 원칙으로 보여야 하는가? | [`DESIGN.md`](./DESIGN.md) | UI/UX 원칙, 카드, CTA, 모바일 규칙 |
| 무엇을 어떻게 테스트해야 하는가? | [`TESTING.md`](./TESTING.md) | 테스트 전략, Golden Path, 완료 기준 |
| 현재 QA 상태와 알려진 위험은 무엇인가? | [`USER_TEST_QA.md`](./USER_TEST_QA.md) | 실제 코드 감사, 위험, 수동 QA 상태 |
| 왜 이렇게 결정했는가? | [`DECISIONS.md`](./DECISIONS.md) | 제품·기술 의사결정 로그 |
| AI는 어떤 권한과 절차로 일하는가? | [`AGENTS.md`](../AGENTS.md) | AI governance, branch/approval 규칙 |
| Frontend/Backend가 함께 바뀌는 기능의 계약은? | [`contracts/`](./contracts/) | 입력·출력·타입·권한·예외 계약 |

---

## 3. AI 작업 전 읽기 순서

### 모든 작업

1. `PROJECT.md`
2. `docs/DECISIONS.md`
3. 작업 영역에 맞는 상세 문서
4. `AGENTS.md`

### 제품·UX 작업

1. `PROJECT.md`
2. `docs/PRODUCT.md`
3. `docs/DESIGN.md`
4. `docs/ROUTES.md`
5. `docs/DECISIONS.md`

### DB/Auth/RLS/API 작업

1. `PROJECT.md`
2. `docs/PRODUCT.md`
3. `docs/DATABASE.md`
4. `docs/MCP.md`
5. `docs/ERD_V1.1_MAPPING.md`
6. 관련 `docs/contracts/*.md`
7. 실제 `supabase/migrations/`
8. 필요하면 Supabase MCP로 실제 현재 상태를 읽기 전용 확인

### QA/버그 수정

1. `docs/TESTING.md`
2. `docs/USER_TEST_QA.md`
3. 관련 제품/DB 문서
4. 실제 코드와 테스트
5. DB/로그 확인이 필요하면 `docs/MCP.md` 기준으로 Supabase MCP 사용

---

## 4. 충돌이 생겼을 때

문서가 실제 코드/DB와 다를 수 있다. 이 경우 임의로 한쪽을 맞다고 가정하지 않는다.

### 제품 범위 충돌

`PROJECT.md`의 현재 MVP 범위를 기준으로 한다. `DECISIONS.md`에서 변경 이유를 확인한다.

### Route 충돌

실제 `app/` 구현과 `middleware.ts`를 확인한 뒤 `ROUTES.md`의 drift 여부를 보고한다.

### DB 충돌

실제 적용 대상은 `supabase/migrations/`과 Supabase schema다. `DATABASE.md`가 다르면 문서 drift로 보고한다. Supabase MCP는 실제 상태 확인에 사용할 수 있지만 현재 Production 연결은 read-only이며, MCP를 통해 schema를 직접 고치지 않는다.

### 테스트 상태 충돌

실제 테스트 실행 결과가 우선이다. `USER_TEST_QA.md`는 감사 시점의 스냅샷으로 취급한다.

---

## 5. 문서 중복 금지 규칙

같은 정보를 여러 문서에서 상세하게 복제하지 않는다.

- `PROJECT.md`: 무엇을/왜 만드는지, 범위
- `PRODUCT.md`: 사용자에게 어떻게 동작하는지
- `ROUTES.md`: 어디에 있는지
- `DATABASE.md`: 어떻게 저장하는지
- `MCP.md`: AI가 외부 시스템을 어떤 권한으로 확인하는지
- `DESIGN.md`: 어떻게 보여주는지
- `TESTING.md`: 어떻게 검증하는지
- `DECISIONS.md`: 왜 그렇게 정했는지

상세 내용이 이미 다른 문서에 있으면 링크로 연결한다.

---

## 6. 문서 변경 규칙

기능을 변경할 때 코드만 바꾸고 문서를 방치하지 않는다.

- 제품 범위 변경 → `PROJECT.md`
- 사용자 흐름/기능 동작 변경 → `PRODUCT.md`
- URL/IA/API route 변경 → `ROUTES.md`
- schema/RLS/RPC 변경 → migration + `DATABASE.md`
- MCP server/권한/연결 정책 변경 → `.cursor/mcp.json` + `MCP.md`
- UI 패턴 변경 → `DESIGN.md`
- 테스트 기준 변경 → `TESTING.md`
- 중요한 선택/철회 → `DECISIONS.md`

한 작업에서 여러 영역이 바뀌면 관련 문서를 같은 branch에서 함께 갱신한다.

---

## 7. Knowledge Base 완료 기준

Knowledge Base가 제대로 작동하려면 AI가 새 기능을 구현하기 전에 다음을 답할 수 있어야 한다.

1. 이 기능이 현재 MVP 범위인가?
2. 어떤 사용자의 어떤 문제를 해결하는가?
3. 기존 사용자 흐름과 충돌하지 않는가?
4. 어떤 route와 DB가 영향을 받는가?
5. 기존 결정과 충돌하지 않는가?
6. 무엇을 테스트해야 완료인가?
7. Production에 반영하기 전 어떤 승인 절차가 필요한가?
8. 외부 시스템 확인이 필요하면 어떤 MCP를 어떤 권한으로 사용할 수 있는가?

답을 찾을 수 없다면 구현 전에 문서 또는 요구사항을 먼저 보완한다.
