# OpenHouse

운동 이벤트를 찾고 참가하는 스포츠 커뮤니티 MVP (웹).

## Setup

### 1. Supabase 프로젝트

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 파일을 **번호 순**으로 실행  
   **`001_initial_schema.sql` → `035_event_registration_counts_rpc.sql`**
3. Authentication → Providers에서 Email 활성화 (로컬 테스트 시 Confirm email OFF 권장)

> 이미 일부만 적용한 경우: [docs/DATABASE.md](docs/DATABASE.md) 마이그레이션 체크리스트와 오류 대응 참고.

### 2. 환경 변수

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase URL과 anon key 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 실행

```bash
npm install
npm run dev
```

기본: http://localhost:3000  
(다른 포트: `npm run dev -- -p 3002`)

### 4. 테스트

```bash
npm test
```

---

## MVP 흐름

1. 회원가입 / 로그인
2. **운영자**: 체육관 등록 → 이벤트 등록
3. **참가자**: 이벤트·체육관 탐색 → 상세 → 참가 신청 (또는 ♥ 관심등록)
4. **운영자**: 참가자 승인 · 공지 작성
5. **참가자**: 참가 취소 · 참가 이력 · 관심 목록 확인

---

## 기능 범위 (요약)

| 구분 | 예시 |
|------|------|
| **MVP** | 이벤트/체육관 탐색, 참가 신청, 호스트 승인·공지 |
| **MVP+** | 관심등록, 운동 친구, 동행 신청, 앱 내 알림, 신고·문의 |
| **Beta** | 후기, 결제, 푸시, 관심 알림·추천, 호스트 통계 |

자세한 분류: [PROJECT.md](PROJECT.md)

---

## 문서

| 문서 | 내용 |
|------|------|
| [PROJECT.md](PROJECT.md) | 제품 방향 · MVP / MVP+ / Beta |
| [docs/ROUTES.md](docs/ROUTES.md) | 화면 · URL · API |
| [docs/DATABASE.md](docs/DATABASE.md) | DB · 마이그레이션 체크리스트 |
| [docs/ERD_V1.1_MAPPING.md](docs/ERD_V1.1_MAPPING.md) | ERD ↔ Supabase 매핑 |
| [docs/MVP-APPLY-HOST.md](docs/MVP-APPLY-HOST.md) | 참가 신청 · 호스트 관리 |
| [AGENTS.md](AGENTS.md) | AI 팀 협업 |
