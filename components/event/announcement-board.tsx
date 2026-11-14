"use client";

import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementPinned,
} from "@/lib/actions/announcement";
import { ConfirmActionButton } from "@/components/event/cancel-event-button";
import { EmptyState } from "@/components/event/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import {
  ANNOUNCEMENT_MAX_LENGTH,
  announcementFormSchema,
  type AnnouncementFormInput,
} from "@/lib/validations/announcement";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface AnnouncementBoardProps {
  eventId: string;
  /** 서버에서 정렬해 내려준 공지 (고정 우선, 최신순) */
  items: Announcement[];
  isHost: boolean;
  /** 취소된 이벤트는 모두에게 읽기 전용입니다. */
  canceled: boolean;
}

// 공지 작성 폼 (주최자 전용). 서버 액션으로 저장하고 서버 목록을 새로고침합니다.
function AnnouncementForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormInput>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: { body: "" },
  });
  // 글자 수 표시용. watch() 대신 useWatch를 써서 React Compiler 메모이제이션을 유지합니다.
  const length = (useWatch({ control, name: "body" }) ?? "").length;
  const overLimit = length > ANNOUNCEMENT_MAX_LENGTH;

  async function onSubmit(values: AnnouncementFormInput) {
    const result = await createAnnouncement(eventId, values.body);
    if (!result.success) {
      // 서버 검증 오류는 필드에 표시하고, 그 외는 토스트로 알립니다.
      const message = result.errors?.body?.[0];
      if (message) setError("body", { message });
      else toast.error(result.message);
      return;
    }
    toast.success("공지를 등록했어요.");
    reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-2"
    >
      <Textarea
        rows={3}
        placeholder="참석자에게 알릴 내용을 적어 주세요."
        aria-label="공지 내용"
        aria-invalid={!!errors.body}
        disabled={isSubmitting}
        {...register("body")}
      />
      <div className="flex items-start justify-between gap-2">
        {errors.body ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.body.message}
          </p>
        ) : (
          <span />
        )}
        <span
          className={
            overLimit
              ? "shrink-0 text-xs text-destructive"
              : "shrink-0 text-xs text-muted-foreground"
          }
        >
          {length}/{ANNOUNCEMENT_MAX_LENGTH}
        </span>
      </div>
      <Button type="submit" className="h-11" disabled={isSubmitting}>
        {isSubmitting ? "등록 중..." : "공지 등록"}
      </Button>
    </form>
  );
}

// 공지 한 건. 주최자는 상단 고정/해제와 삭제를 할 수 있습니다.
function AnnouncementItem({
  item,
  canWrite,
}: {
  item: Announcement;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function togglePin() {
    startTransition(async () => {
      const result = await setAnnouncementPinned(item.id, !item.pinned);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(
        item.pinned ? "상단 고정을 해제했어요." : "상단에 고정했어요.",
      );
      router.refresh();
    });
  }

  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-lg border p-4">
      {item.pinned && (
        <Badge variant="secondary" className="w-fit">
          고정
        </Badge>
      )}
      {/* 공백 없는 긴 URL·영문도 카드 안에서 줄바꿈되게 합니다. (페이지 가로 스크롤 방지) */}
      <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
        {item.body}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatEventDate(item.created_at)}
      </p>
      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 flex-1"
            disabled={isPending}
            onClick={togglePin}
          >
            <Pin className="size-4" />
            {item.pinned ? "고정 해제" : "상단 고정"}
          </Button>
          <ConfirmActionButton
            targetId={item.id}
            className="flex-1"
            triggerLabel={
              <>
                <Trash2 className="size-4" />
                삭제
              </>
            }
            title="공지를 삭제할까요?"
            description="삭제한 공지는 되돌릴 수 없어요."
            confirmLabel="삭제"
            successMessage="공지를 삭제했어요."
            action={deleteAnnouncement}
          />
        </div>
      )}
    </li>
  );
}

// 공지 탭 (F003). 주최자는 작성/삭제/상단 고정을 할 수 있습니다.
export function AnnouncementBoard({
  eventId,
  items,
  isHost,
  canceled,
}: AnnouncementBoardProps) {
  const canWrite = isHost && !canceled;

  return (
    <div className="flex flex-col gap-4">
      {canWrite && <AnnouncementForm eventId={eventId} />}
      {isHost && canceled && (
        <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
          취소된 이벤트라 공지를 더 이상 쓰거나 바꿀 수 없어요.
        </p>
      )}
      {items.length === 0 ? (
        <EmptyState message="등록된 공지가 없습니다." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <AnnouncementItem key={item.id} item={item} canWrite={canWrite} />
          ))}
        </ul>
      )}
    </div>
  );
}
