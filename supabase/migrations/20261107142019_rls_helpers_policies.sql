-- 적용됨: 20261107142019_rls_helpers_policies (apply_migration, 2026-11-07). begin; ... rollback; 시험으로 사전 검증함.
-- Task 006-5 (1/2): rls_helpers_policies
-- 목적: private 헬퍼 함수 4개, authenticated용 GRANT, 모든 RLS 정책
-- 전제: 단일 트랜잭션으로 실행되므로 begin/commit을 쓰지 않습니다.
-- 설계 메모
--  - 정책 간 재귀(42P17)를 막기 위해 events/participations 조회는 SECURITY DEFINER 헬퍼를 경유합니다.
--    (함수 소유자 postgres는 BYPASSRLS이므로 헬퍼 내부 조회에는 RLS가 적용되지 않습니다.)
--  - "멤버" = 이벤트 주최자 또는 participations 행이 있는 사용자(상태 무관)
--  - 쓰기 정책은 최소화: participations / carpool_passengers / settlement_shares 의 쓰기는
--    Task 007~011의 서버 RPC(SECURITY DEFINER)로만 수행합니다.
-- 되돌리기: supabase/rollback/rls_helpers_policies.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. 헬퍼 함수 (private 스키마, search_path 빈 값, 스키마 명시)
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function private.is_event_host(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.host_id = (select auth.uid())
  );
$$;

create or replace function private.is_event_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.host_id = (select auth.uid())
  ) or exists (
    select 1 from public.participations p
    where p.event_id = p_event_id and p.user_id = (select auth.uid())
  );
$$;

-- 현재 사용자와 p_uid가 같은 이벤트에 (주최자 또는 참여자로) 함께 속해 있는지
create or replace function private.shares_event_with(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participations a
    join public.participations b on b.event_id = a.event_id
    where a.user_id = (select auth.uid()) and b.user_id = p_uid
  ) or exists (
    select 1
    from public.events e
    join public.participations p on p.event_id = e.id
    where (e.host_id = (select auth.uid()) and p.user_id = p_uid)
       or (e.host_id = p_uid and p.user_id = (select auth.uid()))
  );
$$;

-- 기본 권한(default privileges)으로 anon/authenticated에 EXECUTE가 붙으므로 명시적으로 회수 후 authenticated만 허용
revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function private.is_event_host(uuid) from public, anon, authenticated;
revoke execute on function private.is_event_member(uuid) from public, anon, authenticated;
revoke execute on function private.shares_event_with(uuid) from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_event_host(uuid) to authenticated;
grant execute on function private.is_event_member(uuid) to authenticated;
grant execute on function private.shares_event_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. 테이블 권한 (anon은 전부 없음 유지). 컬럼 단위로 최소 부여.
--    events.share_code / id / created_at / host_id(수정)는 클라이언트가 바꿀 수 없습니다.
-- ---------------------------------------------------------------------------
grant select, delete on public.events to authenticated;
grant insert (host_id, series_id, title, description, starts_at, location, capacity, rsvp_deadline, transfer_account)
  on public.events to authenticated;
grant update (title, description, starts_at, location, capacity, rsvp_deadline, transfer_account)
  on public.events to authenticated;

grant select, delete on public.event_series to authenticated;
grant insert (host_id, weekday, end_date) on public.event_series to authenticated;
grant update (weekday, end_date) on public.event_series to authenticated;

grant select on public.participations to authenticated;          -- 쓰기는 RPC

grant select, delete on public.announcements to authenticated;
grant insert (event_id, author_id, body, pinned) on public.announcements to authenticated;
grant update (body, pinned) on public.announcements to authenticated;

grant select, delete on public.carpool_rides to authenticated;
grant insert (event_id, driver_id, origin, depart_at, seats) on public.carpool_rides to authenticated;
grant update (origin, depart_at, seats) on public.carpool_rides to authenticated;

grant select on public.carpool_passengers to authenticated;      -- 쓰기는 RPC

grant select, delete on public.expenses to authenticated;
grant insert (event_id, name, amount, payer_id) on public.expenses to authenticated;
grant update (name, amount, payer_id) on public.expenses to authenticated;

grant select on public.settlement_shares to authenticated;       -- 쓰기는 RPC

-- ---------------------------------------------------------------------------
-- 3. 정책 (모두 to authenticated, auth.uid()는 (select ...)로 래핑)
-- ---------------------------------------------------------------------------
-- profiles: 본인 / 같은 이벤트 참여자 / admin 조회. 본인 수정(profiles_update_own)은 그대로 유지.
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_scoped on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.shares_event_with(id))
    or (select private.is_admin())
  );

-- events
create policy events_select on public.events
  for select to authenticated
  using (
    host_id = (select auth.uid())
    or (select private.is_event_member(id))
    or (select private.is_admin())
  );
create policy events_insert_host on public.events
  for insert to authenticated
  with check (host_id = (select auth.uid()));
create policy events_update_host on public.events
  for update to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));
create policy events_delete_host on public.events
  for delete to authenticated
  using (host_id = (select auth.uid()));

-- event_series: 호스트 / admin(조회)
create policy event_series_select on public.event_series
  for select to authenticated
  using (host_id = (select auth.uid()) or (select private.is_admin()));
create policy event_series_insert_host on public.event_series
  for insert to authenticated
  with check (host_id = (select auth.uid()));
create policy event_series_update_host on public.event_series
  for update to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));
create policy event_series_delete_host on public.event_series
  for delete to authenticated
  using (host_id = (select auth.uid()));

-- participations: 멤버 / admin 조회만
create policy participations_select on public.participations
  for select to authenticated
  using ((select private.is_event_member(event_id)) or (select private.is_admin()));

-- announcements: 멤버 / admin 조회, 호스트 쓰기
create policy announcements_select on public.announcements
  for select to authenticated
  using ((select private.is_event_member(event_id)) or (select private.is_admin()));
create policy announcements_insert_host on public.announcements
  for insert to authenticated
  with check (author_id = (select auth.uid()) and (select private.is_event_host(event_id)));
create policy announcements_update_host on public.announcements
  for update to authenticated
  using ((select private.is_event_host(event_id)))
  with check ((select private.is_event_host(event_id)));
create policy announcements_delete_host on public.announcements
  for delete to authenticated
  using ((select private.is_event_host(event_id)));

-- carpool_rides: 멤버 / admin 조회, 운전자(멤버) 쓰기, 운전자 또는 호스트 삭제
create policy carpool_rides_select on public.carpool_rides
  for select to authenticated
  using ((select private.is_event_member(event_id)) or (select private.is_admin()));
create policy carpool_rides_insert_driver on public.carpool_rides
  for insert to authenticated
  with check (driver_id = (select auth.uid()) and (select private.is_event_member(event_id)));
create policy carpool_rides_update_driver on public.carpool_rides
  for update to authenticated
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));
create policy carpool_rides_delete on public.carpool_rides
  for delete to authenticated
  using (driver_id = (select auth.uid()) or (select private.is_event_host(event_id)));

-- carpool_passengers: 멤버 / admin 조회만
create policy carpool_passengers_select on public.carpool_passengers
  for select to authenticated
  using ((select private.is_event_member(event_id)) or (select private.is_admin()));

-- expenses: 멤버 / admin 조회, 호스트 쓰기
create policy expenses_select on public.expenses
  for select to authenticated
  using ((select private.is_event_member(event_id)) or (select private.is_admin()));
create policy expenses_insert_host on public.expenses
  for insert to authenticated
  with check ((select private.is_event_host(event_id)));
create policy expenses_update_host on public.expenses
  for update to authenticated
  using ((select private.is_event_host(event_id)))
  with check ((select private.is_event_host(event_id)));
create policy expenses_delete_host on public.expenses
  for delete to authenticated
  using ((select private.is_event_host(event_id)));

-- settlement_shares: 본인 / 호스트 / admin 조회만
create policy settlement_shares_select on public.settlement_shares
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_event_host(event_id))
    or (select private.is_admin())
  );
