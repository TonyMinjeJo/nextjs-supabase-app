import { LoadingState } from "@/components/loading-state";
import { EventForm } from "@/components/event/event-form";
import { getEvent } from "@/lib/data/events";
import { Suspense } from "react";

// 복제 진입(/events/new?from={id})이면 제목/설명/장소/정원을 미리 채웁니다.
// 일시는 새로 정해야 하므로 비워 둡니다.
async function NewEventContent({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { from } = await searchParams;
  const source = typeof from === "string" ? await getEvent(from) : null;

  return (
    <>
      {source && (
        <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          &quot;{source.title}&quot; 이벤트를 복제했어요. 새 일시를 입력해
          주세요.
        </p>
      )}
      <EventForm
        defaultValues={
          source
            ? {
                title: source.title,
                description: source.description ?? "",
                location: source.location,
                capacity: source.capacity,
              }
            : undefined
        }
      />
    </>
  );
}

// 이벤트 생성 (F001, F008)
export default function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">이벤트 만들기</h1>
      <Suspense fallback={<LoadingState />}>
        <NewEventContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
