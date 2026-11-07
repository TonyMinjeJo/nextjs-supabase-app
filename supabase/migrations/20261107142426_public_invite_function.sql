-- 적용됨: 20261107142426_public_invite_function (apply_migration, 2026-11-07). begin; ... rollback; 시험으로 사전 검증함.
-- Task 006-5 (2/2): public_invite_function
-- 목적: 비로그인 공개 초대 화면용 RPC. 요약 필드만 반환합니다.
-- 반환하지 않는 값: host_id, transfer_account, 참석자 목록, 내부 식별자
-- 의도된 advisor 경고: anon/authenticated가 호출 가능한 SECURITY DEFINER 함수
--   (0028_anon_security_definer_function_executable, 0029_authenticated_security_definer_function_executable).
--   공개 초대 링크 기능의 핵심이며, 입력은 share_code 일치 1건 조회로 제한됩니다.
-- 되돌리기: supabase/rollback/rls_helpers_policies.rollback.sql (함수 삭제 포함)

create or replace function public.get_event_invite(p_code text)
returns table (
  title text,
  description text,
  starts_at timestamptz,
  location text,
  capacity integer,
  rsvp_deadline timestamptz,
  host_name text,
  going_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.title,
    e.description,
    e.starts_at,
    e.location,
    e.capacity,
    e.rsvp_deadline,
    h.full_name,
    (
      select count(*)::integer
      from public.participations p
      where p.event_id = e.id and p.status = 'going'
    )
  from public.events e
  left join public.profiles h on h.id = e.host_id
  where e.share_code = p_code
  limit 1;
$$;

revoke execute on function public.get_event_invite(text) from public;
grant execute on function public.get_event_invite(text) to anon, authenticated;
