-- events_core_tables 되돌리기 (수동 실행, 단일 트랜잭션). 데이터가 모두 삭제됩니다.
-- 후속 마이그레이션(carpool 등)이 events를 참조 중이면 DROP이 실패합니다. 먼저 되돌리세요.
drop table if exists public.announcements;
drop table if exists public.participations;
drop table if exists public.events;
drop table if exists public.event_series;
