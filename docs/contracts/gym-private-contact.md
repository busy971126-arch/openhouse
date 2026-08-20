# Gym Private Contact Contract

Public:
- gyms.phone
- 체육관 공개 문의 전화번호
- 공개 조회 가능

Private:
- gym_private_contacts.representative_name
- representative_phone
- representative_role
- representative_role_custom

Access:
- authenticated gym owner only
- anon denied
- non-owner denied
- RLS enforced

Create:
1. gyms 생성
2. gym_private_contacts 생성
3. private 저장 실패 시 gym 생성 rollback 시도

Edit:
- public gym fields → gyms
- representative fields → gym_private_contacts only

Read:
- public pages never query gym_private_contacts
- owner edit pages query it separately

STEP C:
- no legacy fallback
- gyms.representative_* does not exist
- temporary compatibility trigger/function removed

Migration guard:
- every gym must have private contact row before destructive DROP

Rollback strategy:
- destructive migration을 직접 되돌리지 않는다.
- emergency 시 새 forward migration으로 legacy columns를 재생성하고
  gym_private_contacts에서 backfill할 수 있다.
- Production backup 직접 restore는 최후 수단.
