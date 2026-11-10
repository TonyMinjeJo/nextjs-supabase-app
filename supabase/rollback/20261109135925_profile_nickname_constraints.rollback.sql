-- profile_nickname_constraints 되돌리기 (CLI가 자동 적용하지 않는 별도 위치, 수동 실행)
-- 주의: 2자 닉네임이나 3자 미만 값이 이미 저장돼 있으면 아래 check 복원이 실패합니다.
--       그 경우 해당 username을 먼저 null로 바꾸거나 바꿔 주세요.

alter table public.profiles drop constraint if exists profiles_bio_check;

drop index if exists public.profiles_username_lower_key;

alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles
  add constraint profiles_username_check
  check (char_length(username) >= 3);
