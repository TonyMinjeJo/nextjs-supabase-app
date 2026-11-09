-- 이벤트 커버 이미지: events.cover_image_path, 비공개 버킷 event-covers, storage.objects 정책
-- 전제: 단일 트랜잭션으로 실행되므로 begin/commit을 쓰지 않습니다.
-- 설계 메모
--  - 경로 규칙: {업로더 uid}/{uuid}.{jpg|jpeg|png|webp} (이벤트 생성 시점에는 event id가 없으므로 폴더 = 업로더)
--  - 비공개 버킷: 화면에는 서명 URL로 표시하며, 서명 URL은 SELECT 권한이 있는 멤버/주최자/admin만 발급받을 수 있습니다.
--  - UPDATE 정책 없음: 덮어쓰기 금지(항상 새 파일명).
-- 되돌리기: supabase/rollback/20261108064957_event_cover_image.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. events.cover_image_path (형식 CHECK)
-- ---------------------------------------------------------------------------
alter table public.events add column cover_image_path text;

alter table public.events
  add constraint events_cover_image_path_format check (
    cover_image_path is null
    or cover_image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  );

-- ---------------------------------------------------------------------------
-- 2. 컬럼 단위 GRANT (기존 목록 유지 + cover_image_path)
-- ---------------------------------------------------------------------------
grant insert (cover_image_path) on public.events to authenticated;
grant update (cover_image_path) on public.events to authenticated;

-- ---------------------------------------------------------------------------
-- 3. 비공개 버킷 event-covers (5MB, jpeg/png/webp)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- ---------------------------------------------------------------------------
-- 4. storage.objects 정책 (모두 to authenticated)
-- ---------------------------------------------------------------------------
create policy event_covers_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy event_covers_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy event_covers_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'event-covers'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.events e
        where e.cover_image_path = name
          and (
            (select private.is_event_member(e.id))
            or (select private.is_event_host(e.id))
            or (select private.is_admin())
          )
      )
    )
  );
