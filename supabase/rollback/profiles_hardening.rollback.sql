-- profiles_hardening 마이그레이션 되돌리기 (CLI가 자동 적용하지 않는 별도 위치)
-- 수동 실행용입니다. 단일 트랜잭션으로 실행하세요.
-- 원래 정의는 마이그레이션 적용 전 DB를 SELECT(pg_get_functiondef, pg_policies, information_schema)로
-- 읽은 값 그대로입니다.
--
-- 주의
--  - email은 auth.users.email의 "현재 값"으로 복원됩니다. (원래는 가입 시점 복사본이었음)
--  - 이후 마이그레이션이 user_role 등 enum이나 private 스키마 객체를 사용 중이면
--    아래 DROP TYPE / DROP SCHEMA가 의도적으로 실패합니다(CASCADE 미사용). 그 마이그레이션을 먼저 되돌리세요.
--  - role 컬럼 삭제로 admin 지정 정보는 사라집니다.

-- 순서: email 컬럼을 먼저 복원한 뒤 함수를 교체합니다(역순이면 가입 시 insert가 실패).

-- 1. email 컬럼 재생성 + auth.users에서 값 복원
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;
-- (updated_at 트리거가 발동하여 updated_at이 갱신됩니다. 필요하면 위 update 앞에
--  alter table public.profiles disable trigger profiles_set_updated_at; 를 쓰고 뒤에 enable 하세요.)

-- 2. handle_new_user 원래 본문 복원
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$function$;

-- 3. 권한 원복: 원래 anon / authenticated 모두 테이블 단위 전체 권한
--    (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER; 기본 권한상 MAINTAIN 포함)
--    REVOKE로 컬럼 단위 권한을 먼저 정리한 뒤 GRANT ALL.
revoke all on table public.profiles from anon, authenticated;
grant all on table public.profiles to anon, authenticated;

-- 4. profiles_insert_own 정책 재생성 (원래 정의: roles={authenticated}, permissive, with check)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check ((select auth.uid() as uid) = id);

-- 5. role 컬럼, enum 4개, private 스키마 삭제 (CASCADE 사용 안 함: 의존 객체가 있으면 실패)
alter table public.profiles drop column if exists role;

drop type if exists public.user_role;
drop type if exists public.participation_status;
drop type if exists public.passenger_status;
drop type if exists public.payment_status;

drop schema if exists private;
