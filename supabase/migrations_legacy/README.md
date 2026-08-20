# OpenHouse pre-baseline migration 역사 기록

이 폴더는 OpenHouse의 **pre-baseline migration 역사 기록**이다.

여기에 있는 SQL 파일은 과거 GitHub에 남아 있던 migration이다. **실행 대상이 아니다.**

## 왜 여기로 옮겼는가

- 2026-08-20 기준 Production에는 Supabase migration history가 없었다.
- GitHub `supabase/migrations/`와 실제 Production schema 사이에 drift가 확인되었다.
- `016` migration 번호 중복도 존재한다. (`016_interview_features.sql`, `016_resume.sql`)
- 따라서 이 파일들을 Production에 직접 재실행하지 않는다.

## 앞으로의 관리

- 새로운 Production baseline 이후의 migration만 `supabase/migrations/`에서 관리한다.
- 이 폴더의 SQL 내용은 수정하지 않는다.
- 이 폴더의 SQL을 `supabase db push`, SQL Editor 일괄 실행, 또는 기타 방법으로 Production에 적용하지 않는다.
