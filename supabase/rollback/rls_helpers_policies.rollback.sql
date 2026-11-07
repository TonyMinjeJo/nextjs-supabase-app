-- rls_helpers_policies + public_invite_function 되돌리기 (수동 실행, 단일 트랜잭션)
drop function if exists public.get_event_invite(text);

drop policy if exists settlement_shares_select on public.settlement_shares;
drop policy if exists expenses_delete_host on public.expenses;
drop policy if exists expenses_update_host on public.expenses;
drop policy if exists expenses_insert_host on public.expenses;
drop policy if exists expenses_select on public.expenses;
drop policy if exists carpool_passengers_select on public.carpool_passengers;
drop policy if exists carpool_rides_delete on public.carpool_rides;
drop policy if exists carpool_rides_update_driver on public.carpool_rides;
drop policy if exists carpool_rides_insert_driver on public.carpool_rides;
drop policy if exists carpool_rides_select on public.carpool_rides;
drop policy if exists announcements_delete_host on public.announcements;
drop policy if exists announcements_update_host on public.announcements;
drop policy if exists announcements_insert_host on public.announcements;
drop policy if exists announcements_select on public.announcements;
drop policy if exists participations_select on public.participations;
drop policy if exists event_series_delete_host on public.event_series;
drop policy if exists event_series_update_host on public.event_series;
drop policy if exists event_series_insert_host on public.event_series;
drop policy if exists event_series_select on public.event_series;
drop policy if exists events_delete_host on public.events;
drop policy if exists events_update_host on public.events;
drop policy if exists events_insert_host on public.events;
drop policy if exists events_select on public.events;
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);

revoke all on public.events, public.event_series, public.participations, public.announcements,
  public.carpool_rides, public.carpool_passengers, public.expenses, public.settlement_shares
  from authenticated;

drop function if exists private.shares_event_with(uuid);
drop function if exists private.is_event_member(uuid);
drop function if exists private.is_event_host(uuid);
drop function if exists private.is_admin();
revoke usage on schema private from authenticated;
