-- 20261108074908_event_cancel_delete 되돌리기 (수동 실행, 단일 트랜잭션)
-- 주의: canceled_at 컬럼을 지우므로 취소 상태 정보는 사라집니다(이미 삭제된 이벤트는 복구되지 않음).
-- 이벤트 삭제 권한/정책을 원래대로 복원합니다.

drop function if exists public.delete_event(uuid);
drop function if exists public.cancel_event(uuid);

-- get_event_invite 를 canceled 없는 원래 정의로 복원
drop function if exists public.get_event_invite(text);

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

-- respond_to_event / set_attendance 를 취소 검사 없는 원래 정의로 복원
create or replace function public.respond_to_event(
  p_code text,
  p_response public.participation_status
)
returns table (
  status public.participation_status,
  waitlist_order integer,
  going_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := (select auth.uid());
  v_event_id uuid;
  v_capacity integer;
  v_deadline timestamptz;
  v_prev public.participation_status;
  v_new public.participation_status;
  v_going integer;
  v_order integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  -- 같은 이벤트의 응답을 직렬화 (정원 판정/승급 경쟁 방지)
  select e.id, e.capacity, e.rsvp_deadline
    into v_event_id, v_capacity, v_deadline
  from public.events e
  where e.share_code = p_code
  for update;

  if v_event_id is null then
    raise exception 'event_not_found';
  end if;

  if v_deadline is not null and now() > v_deadline then
    raise exception 'rsvp_closed';
  end if;

  if p_response is null or p_response not in ('going', 'not_going') then
    raise exception 'invalid_response';
  end if;

  select p.status into v_prev
  from public.participations p
  where p.event_id = v_event_id and p.user_id = v_uid;

  if p_response = 'going' then
    if v_prev = 'going' then
      v_new := 'going';
    else
      select count(*)::integer into v_going
      from public.participations p
      where p.event_id = v_event_id and p.status = 'going';

      if v_going < v_capacity then
        v_new := 'going';
      else
        v_new := 'waitlist';
      end if;
    end if;
  else
    v_new := 'not_going';
  end if;

  if v_prev is null then
    insert into public.participations (event_id, user_id, status, created_at)
    values (v_event_id, v_uid, v_new, clock_timestamp());
  elsif v_prev <> v_new then
    -- 상태가 바뀔 때만 대기열 기준 시각 갱신 (대기 유지/참석 유지는 순번 보존)
    update public.participations p
    set status = v_new, created_at = clock_timestamp(), attended = false
    where p.event_id = v_event_id and p.user_id = v_uid;
  end if;

  -- going 이 빠졌으면 대기 1순위부터 승급 (대기 중 불참은 승급 없음)
  if v_prev = 'going' and v_new <> 'going' then
    perform private.promote_waitlist(v_event_id);
  end if;

  select count(*)::integer into v_going
  from public.participations p
  where p.event_id = v_event_id and p.status = 'going';

  if v_new = 'waitlist' then
    select r.rn into v_order
    from (
      select p.user_id,
             (row_number() over (order by p.created_at, p.user_id))::integer as rn
      from public.participations p
      where p.event_id = v_event_id and p.status = 'waitlist'
    ) r
    where r.user_id = v_uid;
  end if;

  return query select v_new, v_order, v_going;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. public.set_attendance: 주최자만, going 참석자만 출석 갱신
-- ---------------------------------------------------------------------------
create or replace function public.set_attendance(
  p_event_id uuid,
  p_user_id uuid,
  p_attended boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.participation_status;
begin
  if (select auth.uid()) is null then
    raise exception 'unauthenticated';
  end if;

  if not (select private.is_event_host(p_event_id)) then
    raise exception 'forbidden';
  end if;

  if p_attended is null then
    raise exception 'invalid_attended';
  end if;

  select p.status into v_status
  from public.participations p
  where p.event_id = p_event_id and p.user_id = p_user_id
  for update;

  if v_status is distinct from 'going' then
    raise exception 'not_going_participant';
  end if;

  update public.participations p
  set attended = p_attended
  where p.event_id = p_event_id and p.user_id = p_user_id;
end;
$$;

revoke execute on function public.respond_to_event(text, public.participation_status) from public, anon, authenticated;
revoke execute on function public.set_attendance(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.respond_to_event(text, public.participation_status) to authenticated;
grant execute on function public.set_attendance(uuid, uuid, boolean) to authenticated;

-- 직접 삭제 권한/정책 복원
grant delete on public.events to authenticated;
create policy events_delete_host on public.events
  for delete to authenticated
  using (host_id = (select auth.uid()));

alter table public.events drop column if exists canceled_at;
