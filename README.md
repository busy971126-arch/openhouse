# OpenHouse

운동 이벤트를 찾고 참가하는 스포츠 커뮤니티 MVP (웹).

## Setup

### 1. Supabase 프로젝트

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 파일을 **번호 순**으로 실행  
   (최소 `001_initial_schema.sql` → 최신 `024_gym_photo_captions.sql`)
3. Authentication → Providers에서 Email 활성화 (MVP 테스트 시 Confirm email OFF 권장)

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

http://localhost:3000 에서 확인

## MVP 흐름

1. 회원가입 / 로그인
2. 운영자: 체육관 등록 → 이벤트 등록
3. 참가자: 이벤트 목록 · 필터 → 상세 → 참가 신청
4. 운영자: 참가자 승인 · 공지 작성
5. 참가자: 참가 취소 · 참가 이력 확인

## 문서

- [DATABASE.md](docs/DATABASE.md) — DB·RLS 설계
- [ROUTES.md](docs/ROUTES.md) — 화면·라우트
- [PROJECT.md](PROJECT.md) — 제품 방향
- [AGENTS.md](AGENTS.md) — AI 팀 협업
