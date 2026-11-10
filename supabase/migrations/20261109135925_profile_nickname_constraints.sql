-- 적용됨: 20261109135925_profile_nickname_constraints (apply_migration, 2026-11-09).
-- profile_nickname_constraints: 닉네임(username)·소개(bio) 제약을 앱 검증(lib/validations/profile.ts)과 맞춥니다.
-- 되돌리기: supabase/rollback/20261109135925_profile_nickname_constraints.rollback.sql
-- 전제: 적용 시점에 profiles.username은 전원 null, bio도 전원 null이라 기존 데이터에 영향이 없습니다.
-- 이 마이그레이션은 제약만 바꿉니다. handle_new_user 트리거, 기존 사용자 backfill,
-- get_event_invite 표시 이름 변경은 후속 작업입니다.

-- 1. username: 2~20자, 한글·영문·숫자·밑줄과 단어 사이 공백 1개만 허용
--    (기존: 3자 이상, 상한 없음 → "민제" 같은 2글자 한글 이름이 막힘)
--    이 정규식은 lib/validations/profile.ts의 NICKNAME_PATTERN과 같아야 합니다. 한쪽만 바꾸지 마세요.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles
  add constraint profiles_username_check
  check (
    username is null
    or (
      char_length(username) between 2 and 20
      and username ~ '^[0-9A-Za-z가-힣_]+( [0-9A-Za-z가-힣_]+)*$'
    )
  );

-- 2. 대소문자만 다른 중복 차단 (기존 profiles_username_key 고유 제약은 그대로 유지)
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- 3. bio: 한 줄 소개 100자 이하 (lib/validations/profile.ts의 BIO_MAX와 같아야 합니다)
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles
  add constraint profiles_bio_check
  check (bio is null or char_length(bio) <= 100);
