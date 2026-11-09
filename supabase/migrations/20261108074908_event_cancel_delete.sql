-- 적용됨: 20261108074908_event_cancel_delete (apply_migration, 2026-11-08). begin; ... rollback; 시험 23개 시나리오로 사전 검증함.
-- Task 007-5: 이벤트 취소·삭제
-- 규칙
--  - 취소: 주최자만. 비용(expenses) 또는 정산(settlement_shares) 행이 있으면 거부. canceled_at 으로 표시(행 유지).
--  - 삭제: 주최자만, 이미 취소된 이벤트만, 비용/정산이 없을 때만. 연결 데이터는 FK on delete cascade 로 함께 삭제.
--  - 두 동작 모두 SECURITY DEFINER RPC 로만 수행합니다. events 직접 DELETE 권한/정책은 회수하고,
--    canceled_at 에는 UPDATE/INSERT 컬럼 권한을 주지 않습니다.
--  - 취소된 이벤트는 respond_to_event / set_attendance 가 event_canceled 로 거부합니다.
--  - get_event_invite 는 canceled 를 추가로 반환합니다.
-- 전제: 단일 트랜잭션으로 실행되므로 begin/commit 을 쓰지 않습니다.
-- 되돌리기: supabase/rollback/20261108074908_event_cancel_delete.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. events.canceled_at (컬럼 GRANT 없음 → 클라이언트가 직접 바꿀 수 없음)
-- ---------------------------------------------------------------------------
alter table public.events add column canceled_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. 직접 삭제 우회 제거
-- ---------------------------------------------------------------------------
drop policy if exists events_delete_host on public.events;
revoke delete on public.events from authenticated;

-- ---------------------------------------------------------------------------
-- 3. public.cancel_event
-- ---------------------------------------------------------------------------
create or replace function public.cancel_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_canceled_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'unauthenticated';
  end if;

  if not (select private.is_event_host(p_event_id)) then
    raise exception 'not_host';
  end if;

  select e.canceled_at into v_canceled_at
  from public.events e
  where e.id = p_event_id
  for update;

  if v_canceled_at is not null then
    raise exception 'already_canceled';
  end if;

  if exists (select 1 from public.expenses x where x.event_id = p_event_id)
     or exists (select 1 from public.settlement_shares s where s.event_id = p_event_id) then
    raise exception 'settlement_in_progress';
  end if;

  update public.events e
  set canceled_at = now()
  where e.id = p_event_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. public.delete_event: 취소된 이벤트만 삭제. 커버 이미지 경로를 반환(스토리지 파일 정리는 서버 액션이 수행)
-- ---------------------------------------------------------------------------
create or replace function public.delete_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_canceled_at timestamptz;
  v_cover text;
begin
  if (select auth.uid()) is null then
    raise exception 'unauthenticated';
  end if;

  if not (select private.is_event_host(p_event_id)) then
    raise exception 'not_host';
  end if;

  select e.canceled_at, e.cover_image_path
    into v_canceled_at, v_cover
  from public.events e
  where e.id = p_event_id
  for update;

  if v_canceled_at is null then
    raise exception 'not_canceled';
  end if;

  if exists (select 1 from public.expenses x where x.event_id = p_event_id)
     or exists (select 1 from public.settlement_shares s where s.event_id = p_event_id) then
    raise exception 'settlement_in_progress';
  end if;

  delete from public.events e where e.id = p_event_id;

  return v_cover;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. respond_to_event: 취소된 이벤트 거부 (기존 본문 유지, 취소 검사만 추가)
-- ---------------------------------------------------------------------------
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
  v_canceled_at timestamptz;
  v_prev public.participation_status;
  v_new public.participation_status;
  v_going integer;
  v_order integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  -- 같은 이벤트의 응답을 직렬화 (정원 판정/승급 경쟁 방지)
  select e.id, e.capacity, e.rsvp_deadline, e.canceled_at
    into v_event_id, v_capacity, v_deadline, v_canceled_at
  from public.events e
  where e.share_code = p_code
  for update;

  if v_event_id is null then
    raise exception 'event_not_found';
  end if;

  if v_canceled_at is not null then
    raise exception 'event_canceled';
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
-- 6. set_attendance: 취소된 이벤트 거부 (기존 본문 유지, 취소 검사만 추가)
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

  if exists (
    select 1 from public.events e
    where e.id = p_event_id and e.canceled_at is not null
  ) then
    raise exception 'event_canceled';
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

-- ---------------------------------------------------------------------------
-- 7. get_event_invite: canceled 추가 (기존 반환 필드 유지)
-- ---------------------------------------------------------------------------
drop function if exists public.get_event_invite(text);

create function public.get_event_invite(p_code text)
returns table (
  title text,
  description text,
  starts_at timestamptz,
  location text,
  capacity integer,
  rsvp_deadline timestamptz,
  host_name text,
  going_count integer,
  canceled boolean
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
    ),
    (e.canceled_at is not null)
  from public.events e
  left join public.profiles h on h.id = e.host_id
  where e.share_code = p_code
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 8. 권한: 기본 EXECUTE 회수 후 필요한 것만 허용
-- ---------------------------------------------------------------------------
revoke execute on function public.cancel_event(uuid) from public, anon, authenticated;
revoke execute on function public.delete_event(uuid) from public, anon, authenticated;
revoke execute on function public.respond_to_event(text, public.participation_status) from public, anon, authenticated;
revoke execute on function public.set_attendance(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.get_event_invite(text) from public;

grant execute on function public.cancel_event(uuid) to authenticated;
grant execute on function public.delete_event(uuid) to authenticated;
grant execute on function public.respond_to_event(text, public.participation_status) to authenticated;
grant execute on function public.set_attendance(uuid, uuid, boolean) to authenticated;
grant execute on function public.get_event_invite(text) to anon, authenticated;
