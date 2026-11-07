-- 적용됨: 20261107140926_carpool_settlement_tables (apply_migration, 2026-11-07). begin; ... rollback; 시험으로 사전 검증함.
-- Task 006-4: carpool_settlement_tables
-- 목적: carpool_rides, carpool_passengers, expenses, settlement_shares 생성
-- 전제: apply_migration이 파일 전체를 단일 트랜잭션으로 실행하므로 begin/commit을 쓰지 않습니다.
-- 권한: anon, authenticated 모두 테이블 권한을 회수합니다. GRANT와 정책은 Task006-5에서 결정합니다.
-- 되돌리기: supabase/rollback/carpool_settlement_tables.rollback.sql

-- 1. carpool_rides (memo 컬럼은 두지 않음)
create table public.carpool_rides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  origin text not null,
  depart_at timestamptz not null,
  seats integer not null check (seats >= 1),
  created_at timestamptz not null default now(),
  -- carpool_passengers의 복합 FK (ride_id, event_id) 대상
  constraint carpool_rides_id_event_id_key unique (id, event_id)
);
alter table public.carpool_rides enable row level security;
revoke all on table public.carpool_rides from anon, authenticated;
create index carpool_rides_event_id_idx on public.carpool_rides (event_id);
create index carpool_rides_driver_id_idx on public.carpool_rides (driver_id);

-- 2. carpool_passengers
--    event_id는 정합성용 비정규화: 복합 FK로 탑승 행의 이벤트가 운행의 이벤트와 항상 일치합니다.
create table public.carpool_passengers (
  ride_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null,
  status public.passenger_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id),
  constraint carpool_passengers_ride_event_fkey
    foreign key (ride_id, event_id) references public.carpool_rides (id, event_id) on delete cascade
);
alter table public.carpool_passengers enable row level security;
revoke all on table public.carpool_passengers from anon, authenticated;
create index carpool_passengers_ride_id_idx on public.carpool_passengers (ride_id);
create index carpool_passengers_user_id_idx on public.carpool_passengers (user_id);
create index carpool_passengers_event_id_idx on public.carpool_passengers (event_id);

-- 3. expenses (금액은 정수 원 단위)
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(btrim(name)) >= 1),
  amount integer not null check (amount > 0),
  payer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
revoke all on table public.expenses from anon, authenticated;
create index expenses_event_id_idx on public.expenses (event_id);
create index expenses_payer_id_idx on public.expenses (payer_id);

-- 4. settlement_shares
--    이벤트 x 사용자별 "총 분담액" 1행만 저장합니다. 항목별 분담 내역은 DB에 두지 않고
--    lib/settlement.ts의 calcShares로 계산합니다. 입금 상태 전환 규칙(표시/확인/잠금)은
--    Task 011의 서버 RPC에서 구현하므로 여기서는 컬럼만 둡니다.
create table public.settlement_shares (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'unpaid',
  marked_at timestamptz,
  confirmed_at timestamptz,
  primary key (event_id, user_id)
);
alter table public.settlement_shares enable row level security;
revoke all on table public.settlement_shares from anon, authenticated;
create index settlement_shares_user_id_idx on public.settlement_shares (user_id);
