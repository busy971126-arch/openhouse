<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OpenHouse AI Governance

## 목적

이 문서는 OpenHouse 프로젝트의 AI 협업 거버넌스를 정의한다.

모든 AI 도구와 사람은 `PROJECT.md`의 프로젝트 방향과 MVP 원칙을 최우선으로 따른다.

---

## 권한 구조 (병렬 역할)

OpenHouse의 최상위 AI 협업 구조는 **계층이 아니라 병렬 역할**이다.

| 역할 | 책임 |
|------|------|
| **Founder** | 최종 승인 (YES / NO) |
| **ChatGPT** | Plan / Spec / Review |
| **Cursor** | Implementation |

Founder가 최종 의사결정권을 가진다. ChatGPT와 Cursor는 Founder가 승인한 범위 안에서 각자의 역할을 수행한다.

---

## 1. Founder

Founder는 OpenHouse 프로젝트의 **최종 의사결정자**이다.

### 권한

- 기능 범위 승인
- Preview 검증
- Production 배포 승인
- 최종 **YES / NO** 권한 보유

### 책임

- 제품 방향과 MVP 범위 확정
- Preview 환경에서 동작 검증
- Production 반영 여부 최종 판단
- AI가 제안한 변경 중 승인·거절 결정

---

## 2. ChatGPT

### 기본 역할

- 제품 기획
- 사용자 문제 분석
- 기능 우선순위 판단
- 요구사항 작성
- 구현 명세 작성
- `docs/contracts/` 작성 지원
- 코드 및 DB 변경사항 리뷰
- 테스트 시나리오 작성

### 기본적으로 하지 않는 일

- 애플리케이션 코드 직접 수정
- DB 직접 변경
- `main` 브랜치 직접 수정
- Founder 승인 없는 구현

### 예외

Founder가 명시적으로 **"GitHub에 직접 수정해줘"**라고 요청한 경우에만, **별도 working branch**에서 수정할 수 있다.

---

## 3. Cursor

### 역할

- 실제 코드 구현 담당
- Frontend 구현
- Backend 구현
- Supabase migration 작성
- 테스트
- 버그 수정
- Refactoring

### 규칙

- Founder가 승인하거나 명시적으로 요청한 요구사항을 기준으로 구현한다. ChatGPT는 요구사항을 분석·구체화할 수 있지만 제품 범위를 최종 승인하지 않는다.
- 구현 전 **수정할 파일과 작업 계획**을 먼저 설명한다.
- `main` 브랜치에서 직접 기능 개발하지 않는다.
- **working branch**에서 작업한다.
- 요구사항에 없는 기능을 임의로 추가하지 않는다.
- DB schema를 임의로 변경하지 않는다.

### Working Branch

기능 개발 및 일반적인 코드 변경은 `main`이 아닌 **working branch**에서 진행한다.

권장 branch prefix:

- `feat/` — 기능
- `fix/` — 버그 수정
- `docs/` — 문서
- `refactor/` — 리팩터링
- `chore/` — 기타 유지보수

### Cursor 내부 작업 역할 (선택 사용)

Cursor 안에서 아래 역할을 `@` 호출로 사용할 수 있다. 이들은 **Cursor 내부 구현 분업**이며, 최상위 권한 구조를 대체하지 않는다.

| 역할 | 용도 | Cursor 규칙 파일 |
|------|------|------------------|
| **Rapid Prototyper** | MVP 범위·우선순위·작업 분해·Interface Contract 변환·완료 기준 검토 | `.cursor/rules/rapid-prototyper.mdc` |
| **Backend Architect** | DB·Auth·RLS·API 설계 및 구현 | `.cursor/rules/backend-architect.mdc` |
| **Frontend Developer** | 화면·컴포넌트·UX 구현 | `.cursor/rules/frontend-developer.mdc` |

---

## 4. GitHub — Single Source of Truth

OpenHouse의 **Single Source of Truth**는 GitHub이다.

프로젝트 관련 최종 상태는 GitHub에 저장된 다음을 기준으로 판단한다.

- `PROJECT.md`
- `AGENTS.md`
- `docs/`
- database migration (`supabase/migrations/`)
- source code

ChatGPT 대화나 Cursor 대화만 존재하고 **GitHub에 기록되지 않은 결정**은 공식 프로젝트 결정으로 간주하지 않는다.

---

## 5. AI 충돌 방지 규칙

- ChatGPT와 Cursor가 **같은 branch를 동시에 수정하지 않는다.**
- 하나의 기능에는 **하나의 구현 주체**만 존재한다.
- 기본 구현 주체는 **Cursor**이다.
- ChatGPT는 기본적으로 **Review / Plan** 역할을 맡는다.
- Cursor는 Founder가 승인한 요구사항을 **Implementation** 한다.
- 불확실한 요구사항은 임의 해석하지 않고 **Founder에게 질문**한다.

---

## 6. 기본 개발 흐름

### YES 경로

```text
Founder 아이디어
→ ChatGPT 분석
→ 요구사항 확정
→ 필요하면 docs/contracts/*.md 작성
→ Cursor 구현
→ Working Branch Push
→ Vercel Preview
→ Founder 검증
→ YES이면 Main Merge
→ Production
```

### NO 경로

```text
Founder 피드백
→ ChatGPT 또는 Founder가 수정 요구사항 정리
→ Cursor 수정
→ Preview 재배포
→ Founder 재검증
```

---

## 7. 변경 위험도에 따른 Workflow

변경 위험도에 따라 절차를 달리한다.

### Low Risk

- 문서
- 오타
- 주석
- 런타임에 영향을 주지 않는 변경

→ Founder 판단으로 절차 간소화 가능

### Normal Risk

- UI
- 사용자 흐름
- 기능
- API

→ Working Branch → Vercel Preview → Founder 승인 → Main Merge

### High Risk

- DB Schema
- Migration
- Auth
- RLS
- Storage 권한
- 개인정보
- 데이터 삭제

→ Working Branch → Local 또는 Staging 검증 → Vercel Preview → Founder 승인 → Main Merge → Production 적용 → Smoke Test

Smoke Test는 Production 반영 직후 핵심 기능이 정상 작동하는지만 짧게 확인하는 절차이다.

예:

- 로그인 가능
- 핵심 페이지 접근 가능
- 변경된 기능 정상 작동
- 주요 오류 없음

---

## 8. Interface Contract

Frontend와 Backend가 **동시에 영향**을 받는 기능은, 구현 전에 **Interface Contract**를 먼저 확정한다.

### 저장 위치

```text
docs/contracts/<feature-name>.md
```

### 최소 내용

- 입력
- 출력
- Type
- 상태값
- 권한
- 오류/예외
- 관련 DB/API

### 적용 규칙

- **Rapid Prototyper**는 Founder가 승인한 제품 요구사항을 기술 작업과 Interface Contract로 변환한다.
- **Backend Architect**와 **Frontend Developer**는 동일한 Contract를 기준으로 구현한다.
- 한쪽이 구현 중 Contract를 임의 변경하지 않는다.
- 변경이 필요한 경우 **먼저 Contract를 수정하고 공유**한 뒤 구현을 진행한다.

---

## 9. 절대 금지

- AI가 독단적으로 Production DB 수정
- 기능 개발 및 일반적인 코드 변경을 `main`에서 직접 수행
- **Normal / High Risk** runtime 변경을 Preview 확인 없이 Production 반영
- 승인 없이 새로운 라이브러리 추가
- 승인 없이 DB schema 변경
- 환경변수나 secret을 GitHub에 commit
- 테스트 목적으로 Production 데이터 수정

---

## 공통 원칙

모든 AI와 협업 참여자는 다음 원칙을 따른다.

1. OpenHouse는 코드 프로젝트가 아니라 **제품 프로젝트**다.
2. 항상 **실제 사용자 문제**를 먼저 생각한다.
3. MVP에 필요하지 않은 기능은 **제안만** 하고 구현하지 않는다.
4. 미래 확장을 이유로 현재 구조를 복잡하게 만들지 않는다.
5. 새로운 기능, 라이브러리, 기술 스택 변경은 **Founder 승인 없이** 진행하지 않는다.
6. 작업을 시작하기 전에 **무엇을 할지** 먼저 설명한다.
7. 한 번에 큰 기능을 만들지 않고 **30분~1시간 단위**의 작은 작업으로 나눈다.
8. 초보 개발자도 이해할 수 있도록 설명한다.
9. 항상 **실행 가능한 상태**를 유지한다.
10. 중요한 의사결정이 필요하면 임의로 결정하지 말고 **Founder에게 질문**한다.

---

## 작업 요청 형식

기능 작업을 시작할 때 가능하면 아래 형식을 사용한다.

```text
작업 이름:

해결하려는 사용자 문제:

현재 MVP에 필요한 이유:

담당 역할: (ChatGPT / Cursor / Rapid Prototyper / Backend Architect / Frontend Developer)

완료 기준:

관련 파일:
```

---

## MVP 우선순위 분류 (ChatGPT · Rapid Prototyper 공통)

새 기능 요청 시 다음 중 하나로 분류한다.

- **MVP** — 지금 검증 루프에 필수
- **Fast Follow** — MVP 직후, 피드백 기반
- **Backlog** — 나중에 검토

판단 기준:

1. 실제 사용자 문제를 해결하는가?
2. 지금 MVP에 필요한가?
3. 이 기능이 없으면 핵심 흐름이 끊기는가?
4. 3일 안에 검증 가능한 형태로 만들 수 있는가?
5. 더 단순한 방법은 없는가?

---

## 역할 호출 예시 (Cursor 내부)

### Rapid Prototyper

```text
@rapid-prototyper

PROJECT.md를 기준으로 이 기능이 현재 MVP에 필요한지 판단해줘.
필요하다면 30분~1시간 단위의 작은 작업으로 나눠줘.
아직 코드는 작성하지 마.
```

### Backend Architect

```text
@backend-architect

승인된 MVP 범위 안에서 이 기능의 DB와 권한 구조를 설계해줘.
구현 전에 테이블, 관계, RLS, 예외 상황을 설명해줘.
아직 코드는 수정하지 마.
```

### Frontend Developer

```text
@frontend-developer

승인된 기능 명세를 기준으로 모바일 우선 화면을 구현해줘.
작업 전에 수정할 파일과 구현 순서를 먼저 설명해줘.
MVP에 필요하지 않은 UI는 추가하지 마.
```

---

## 최종 의사결정권

AI는 제안하고 구현을 돕는다.

프로젝트 방향, 기능 범위, 기술 선택, Production 반영에 대한 **최종 결정권은 Founder**에게 있다.

불확실한 경우 추측하지 말고 반드시 Founder에게 질문한다.
