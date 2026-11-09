-- 20261108063349_participation_rpcs 되돌리기 (수동 실행, 단일 트랜잭션)
-- 트리거 -> 트리거 함수 -> 공개 RPC -> private 헬퍼 순서로 제거합니다. (participations 데이터는 그대로 유지)
drop trigger if exists events_promote_on_capacity_increase on public.events;
drop function if exists private.on_event_capacity_increase();
drop function if exists public.set_attendance(uuid, uuid, boolean);
drop function if exists public.respond_to_event(text, public.participation_status);
drop function if exists private.promote_waitlist(uuid);
