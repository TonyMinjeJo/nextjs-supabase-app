-- 적용됨: 20261107140611_profiles_hardening (apply_migration, 2026-11-07). 롤백 시험(begin; ... rollback;)으로 사전 검증함.
--
-- Task 006-2: profiles_hardening
-- 목적: enum 4개, profiles.role 추가, profiles.email 삭제, 권한(GRANT) 재구성,
--       profiles_insert_own 제거, handle_new_user 보강, private 스키마 생성
-- 전제: apply_migration / supabase CLI가 파일 전체를 단일 트랜잭션으로 실행하므로
--       begin/commit을 직접 쓰지 않습니다. 재실행해도 오류가 나지 않도록 작성했습니다.
-- 되돌리기: supabase/rollback/profiles_hardening.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. enum 4개 (값은 lib/types/* 및 docs/PRD.md와 일치)
--    create type에는 if not exists가 없어 pg_type 조회로 멱등성을 확보합니다.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    create type public.user_role as enum ('user', 'admin');
  end if;

  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'participation_status'
  ) then
    create type public.participation_status as enum ('going', 'not_going', 'waitlist');
  end if;

  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'passenger_status'
  ) then
    create type public.passenger_status as enum ('pending', 'accepted', 'rejected');
  end if;

  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'payment_status'
  ) then
    create type public.payment_status as enum ('unpaid', 'marked', 'confirmed');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user 보강 (email 컬럼 삭제보다 먼저 교체: 삭제 후 구 본문이 남지 않게)
--    - full_name: full_name -> name -> 이메일 아이디 순서. 빈 문자열은 null로 취급
--    - avatar_url: avatar_url -> picture (Google은 picture를 사용)
--    - email은 더 이상 저장하지 않음, role은 컬럼 기본값('user') 사용
--    - on conflict (id) do nothing: 중복 호출이어도 가입이 막히지 않음
--    - 예외를 삼키지 않음: 프로필 없는 사용자는 이후 FK(참석 등)가 깨지므로 실패를 드러내는 쪽이 안전.
--      username은 insert하지 않아(null) UNIQUE/CHECK 위반 가능성이 없음.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    ),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'picture'), '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. profiles.role 추가 (not null, 기본 'user'). 기존 1행은 'user'가 됩니다.
--    첫 admin 지정은 이 마이그레이션에 포함하지 않습니다(별도 승인 후 UPDATE).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role public.user_role not null default 'user';

-- ---------------------------------------------------------------------------
-- 4. profiles.email 삭제
--    원본은 auth.users.email이므로 복구 가능(롤백 SQL이 auth.users에서 복원).
--    이 컬럼을 참조하는 정책/뷰/인덱스/제약은 없음(확인 완료). 함수는 2단계에서 교체됨.
-- ---------------------------------------------------------------------------
alter table public.profiles drop column if exists email;

-- ---------------------------------------------------------------------------
-- 5. 권한 재구성
--    반드시 REVOKE ALL을 먼저 실행합니다. 테이블 단위 권한이 남아 있으면 컬럼 단위 GRANT가
--    무의미해져 role 컬럼이 UPDATE 가능한 채로 남습니다. (REVOKE ALL은 컬럼 권한도 함께 회수)
--    service_role / postgres 등 다른 롤의 권한은 건드리지 않습니다.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;

-- authenticated: 조회 + 허용 컬럼 4개만 수정. role, id, created_at, updated_at은 수정 불가.
-- (updated_at은 profiles_set_updated_at 트리거가 갱신하며 SET 대상 컬럼이 아니므로 권한 불필요)
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url, username, bio) on table public.profiles to authenticated;
-- anon: 권한 없음

-- ---------------------------------------------------------------------------
-- 6. profiles_insert_own 정책 삭제 (프로필은 handle_new_user 트리거가 생성, INSERT 권한도 제거됨)
--    profiles_select_authenticated(using true)는 Task006-5까지 유지.
--    profiles_update_own의 using / with check는 (select auth.uid()) = id 이며 role 보호와 무관:
--    role 변경은 5단계의 컬럼 권한이 42501(insufficient_privilege)로 차단합니다.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_insert_own on public.profiles;

-- ---------------------------------------------------------------------------
-- 7. private 스키마 (Task006-5의 RLS 헬퍼 함수용)
--    anon/authenticated에 USAGE를 주지 않으므로 PostgREST로 노출/호출되지 않습니다.
--    헬퍼 함수는 SECURITY DEFINER로 만들고, 정책이 호출하는 롤에 대한 USAGE/EXECUTE는 Task006-5에서 결정합니다.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
