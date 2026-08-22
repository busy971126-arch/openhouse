# OpenHouse MCP

OpenHouse에서 AI가 외부 시스템을 사용할 때의 MCP(Model Context Protocol) 연결 기준이다.

현재 MCP의 목적은 **Cursor가 Supabase의 실제 구조와 상태를 직접 읽어 개발 판단에 활용하도록 하는 것**이다. Production 데이터나 스키마를 AI가 임의로 변경하는 용도로 사용하지 않는다.

---

## 1. 현재 연결

### Supabase

프로젝트 수준 설정 파일:

```text
.cursor/mcp.json
```

연결 대상:

- OpenHouse Supabase project
- project scoped
- read-only
- enabled feature groups: `docs`, `database`, `debugging`, `development`

현재 서버 이름:

```text
supabase-openhouse-readonly
```

---

## 2. 왜 read-only인가

현재 OpenHouse는 별도의 Supabase Development 프로젝트/branch가 없는 상태다.

따라서 AI가 현재 프로젝트에 쓰기 권한으로 연결되면 다음 위험이 있다.

- Production schema 임의 변경
- 잘못된 SQL 실행
- 데이터 수정/삭제
- RLS/Auth 정책 손상
- migration 기록과 실제 DB 상태 drift

그래서 현재 MCP는 **읽기 전용**으로 제한한다.

DB 변경이 필요한 경우 기존 OpenHouse 개발 절차를 따른다.

```text
요구사항 확정
→ DATABASE.md / 관련 contract 확인
→ migration 작성
→ Review
→ Founder 승인
→ 별도 적용 절차
```

MCP를 사용해 Production schema를 직접 고치지 않는다.

---

## 3. Cursor에서 할 수 있는 일

Supabase MCP를 통해 아래 작업을 보조할 수 있다.

### Database inspection

- 현재 table 확인
- column / relation 확인
- migration 상태 확인
- 읽기 전용 SQL 조회

### Debugging

- 최근 로그 확인
- security advisor 확인
- performance advisor 확인

### Development

- project URL 확인
- publishable key 정보 확인
- TypeScript type 생성 지원

### Documentation

- 최신 Supabase 공식 문서 검색

---

## 4. Cursor에서 하면 안 되는 일

현재 MCP 연결에서는 아래 작업을 시도하지 않는다.

- Production 데이터 INSERT / UPDATE / DELETE
- schema 직접 변경
- migration 직접 적용
- Auth 사용자 데이터 수정
- RLS 정책 직접 변경
- Edge Function 배포
- Storage 설정 변경

필요하면 먼저 Founder 승인과 별도 Development 환경을 만든다.

---

## 5. 인증 방법

`.cursor/mcp.json`은 인증 토큰을 저장하지 않는다.

Cursor에서 프로젝트를 연 뒤:

1. Cursor의 Customize / MCP 화면을 연다.
2. `supabase-openhouse-readonly` 서버를 찾는다.
3. OAuth 인증을 시작한다.
4. 브라우저에서 OpenHouse가 속한 Supabase organization 접근을 승인한다.
5. Cursor를 새로고침하거나 재시작한다.

인증 정보나 PAT, service-role key를 GitHub에 commit하지 않는다.

---

## 6. 연결 확인 Prompt

Cursor에서 아래처럼 확인한다.

```text
Supabase MCP를 사용해서 현재 OpenHouse 프로젝트의 public schema table 목록을 보여줘.
아무것도 수정하지 마.
```

또는:

```text
Supabase MCP를 사용해서 현재 migration 상태를 확인하고
DATABASE.md와 실제 schema 사이에 drift가 있는지만 분석해줘.
수정은 하지 마.
```

또는:

```text
Supabase security advisor를 확인해서 중요한 항목만 정리해줘.
아직 SQL이나 migration은 작성하지 마.
```

---

## 7. AI 작업 규칙

MCP 결과는 외부 시스템의 실제 상태를 확인하는 근거로 사용한다.

다만 다음 우선순위를 지킨다.

```text
제품 결정
PROJECT.md / PRODUCT.md / DECISIONS.md

DB 설계 의도
DATABASE.md / contracts / migrations

실제 현재 DB 상태
Supabase MCP
```

문서와 실제 DB가 다르면 **임의 수정하지 않고 drift로 보고**한다.

---

## 8. 향후 단계

Closed Beta 이후 DB 변경이 잦아지면 Supabase Development project 또는 database branch를 별도로 둔다.

그때는 다음 구조가 목표다.

```text
Cursor
  │
  ├─ Supabase Development MCP
  │      └─ write 허용 가능
  │
  └─ Supabase Production MCP
         └─ read-only 유지
```

Development 환경 생성에는 비용이 발생할 수 있으므로 Founder 승인 후 진행한다.

---

## 핵심 원칙

> MCP는 AI에게 Production 권한을 주는 장치가 아니라, AI가 실제 시스템을 더 정확하게 이해하도록 연결하는 장치로 사용한다.
