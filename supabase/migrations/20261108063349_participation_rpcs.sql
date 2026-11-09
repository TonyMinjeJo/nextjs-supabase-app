-- 적용됨: 20261108063349_participation_rpcs (begin; ... rollback; 시험 S1~S11 통과 후 apply_migration)
-- Task 008-1: participation_rpcs
-- 목적: 참석 응답(정원/대기/마감), 대기 승급, 출석 체크 RPC와 정원 증가 승급 트리거
-- 전제: 단일 트랜잭션으로 실행되므로 begin/commit을 쓰지 않습니다.
-- 설계 메모
--  - participations 쓰기는 GRANT/정책이 없으므로 아래 SECURITY DEFINER 함수로만 수행합니다.
--  - 동시성: respond_to_event 는 events 행을 for update 로 잠가 같은 이벤트의 응답을 직렬화합니다.
--    정원 증가 트리거는 events UPDATE 가 이미 행 잠금을 쥔 상태에서 승급하므로 같은 직렬화 안에 있습니다.
--  - created_at 은 "대기열 기준 시각"입니다. 상태가 바뀔 때만 clock_timestamp() 로 갱신합니다.
--    (같은 트랜잭션 안에서도 순서가 구분되도록 now() 대신 clock_timestamp() 사용. 정렬 동률은 user_id 로 결정)
--  - 정원을 줄여 going 이 정원을 넘어도 강등하지 않습니다.
--  - 오류는 raise exception 메시지가 곧 코드 문자열입니다:
--    unauthenticated / event_not_found / rsvp_closed / invalid_response / forbidden / not_going_participant / invalid_attended
-- 의도된 advisor 경고: authenticated 가 호출 가능한 SECURITY DEFINER 함수
--   (0029_authenticated_security_definer_function_executable) - respond_to_event, set_attendance
-- 되돌리기: supabase/rollback/participation_rpcs.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. private.promote_waitlist: 정원 여유만큼 대기자를 created_at 순으로 going 승급
--    호출자가 events 행 잠금을 쥐고 있어야 합니다. (직접 호출 불가: 아래에서 권한 전부 회수)
-- ---------------------------------------------------------------------------
create or replace function private.promote_waitlist(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_going integer;
begin
  select e.capacity into v_capacity
  from public.events e
  where e.id = p_event_id;

  if v_capacity is null then
    return;
  end if;

  select count(*)::integer into v_going
  from public.participations p
  where p.event_id = p_event_id and p.status = 'going';

  if v_going >= v_capacity then
    return;
  end if;

  update public.participations p
  set status = 'going', attended = false
  where p.event_id = p_event_id
    and p.user_id in (
      select w.user_id
      from public.participations w
      where w.event_id = p_event_id and w.status = 'waitlist'
      order by w.created_at, w.user_id
      limit (v_capacity - v_going)
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. public.respond_to_event: 참석/불참 응답
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

-- ---------------------------------------------------------------------------
-- 4. 정원 증가 시 자동 승급 트리거 (감소 시 강등 없음)
-- ---------------------------------------------------------------------------
create or replace function private.on_event_capacity_increase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.capacity > old.capacity then
    perform private.promote_waitlist(new.id);
  end if;
  return null;
end;
$$;

create trigger events_promote_on_capacity_increase
  after update of capacity on public.events
  for each row
  when (new.capacity > old.capacity)
  execute function private.on_event_capacity_increase();

-- ---------------------------------------------------------------------------
-- 5. 권한: 기본 권한으로 붙는 EXECUTE 회수 후 필요한 것만 authenticated 허용
--    private 함수는 SECURITY DEFINER 공개 함수/트리거 내부에서만 호출되므로 직접 실행 권한을 주지 않습니다.
-- ---------------------------------------------------------------------------
revoke execute on function private.promote_waitlist(uuid) from public, anon, authenticated;
revoke execute on function private.on_event_capacity_increase() from public, anon, authenticated;

revoke execute on function public.respond_to_event(text, public.participation_status) from public, anon, authenticated;
revoke execute on function public.set_attendance(uuid, uuid, boolean) from public, anon, authenticated;

grant execute on function public.respond_to_event(text, public.participation_status) to authenticated;
grant execute on function public.set_attendance(uuid, uuid, boolean) to authenticated;
