-- 20261108064957_event_cover_image 되돌리기 (수동 실행, 단일 트랜잭션)
-- 정책 -> 컬럼 순서로 제거합니다.
-- 주의: SQL로 storage.buckets/objects를 직접 삭제할 수 없습니다(storage.protect_delete 트리거).
--       버킷 event-covers 는 이 스크립트 실행 후 대시보드 또는 Storage API(emptyBucket -> deleteBucket)로 삭제하세요.
-- 주의: cover_image_path 컬럼 데이터는 삭제됩니다.
drop policy if exists event_covers_select on storage.objects;
drop policy if exists event_covers_delete_own on storage.objects;
drop policy if exists event_covers_insert_own on storage.objects;
alter table public.events drop constraint if exists events_cover_image_path_format;
alter table public.events drop column if exists cover_image_path; -- 컬럼 GRANT도 함께 사라집니다
