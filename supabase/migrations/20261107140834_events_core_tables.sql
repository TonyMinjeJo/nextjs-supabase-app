-- 적용됨: 20261107140834_events_core_tables (apply_migration, 2026-11-07). begin; ... rollback; 시험으로 사전 검증함.
-- Task 006-3: events_core_tables
-- 목적: event_series, events, participations, announcements 생성 (RLS 활성화, 정책은 Task006-5에서 일괄 생성)
-- 전제: apply_migration이 파일 전체를 단일 트랜잭션으로 실행하므로 begin/commit을 쓰지 않습니다.
-- 권한: anon, authenticated 모두 테이블 권한을 회수합니다. (정책 없음 + 권한 없음 = 접근 불가)
--       authenticated에 대한 GRANT 범위는 Task006-5에서 정책과 함께 결정합니다.
-- 되돌리기: supabase/rollback/events_core_tables.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. event_series (주간 반복 규칙)
-- ---------------------------------------------------------------------------
create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=일 ~ 6=토
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.event_series enable row level security;
revoke all on table public.event_series from anon, authenticated;

create trigger event_series_set_updated_at
  before update on public.event_series
  for each row execute function public.set_updated_at();

create index event_series_host_id_idx on public.event_series (host_id);

-- ---------------------------------------------------------------------------
-- 2. events
--    share_code: 12자 URL-safe(base64url, 패딩 없음). 링크 공유 후 변경 불가이므로 여기서 확정.
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid references public.event_series (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text,
  starts_at timestamptz not null,
  location text not null,
  capacity integer not null check (capacity >= 1),
  rsvp_deadline timestamptz,
  share_code text not null unique
    default translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_'),
  transfer_account text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_rsvp_deadline_before_start check (rsvp_deadline is null or rsvp_deadline < starts_at)
);
alter table public.events enable row level security;
revoke all on table public.events from anon, authenticated;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index events_host_id_idx on public.events (host_id);
create index events_series_id_idx on public.events (series_id);
create index events_starts_at_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- 3. participations (PK: event_id + user_id)
-- ---------------------------------------------------------------------------
create table public.participations (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.participation_status not null,
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.participations enable row level security;
revoke all on table public.participations from anon, authenticated;

create index participations_user_id_idx on public.participations (user_id);
create index participations_event_status_created_idx
  on public.participations (event_id, status, created_at);

-- ---------------------------------------------------------------------------
-- 4. announcements
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) >= 1),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;

create index announcements_author_id_idx on public.announcements (author_id);
create index announcements_event_pinned_created_idx
  on public.announcements (event_id, pinned desc, created_at desc);
