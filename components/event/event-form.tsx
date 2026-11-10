"use client";

import { createEvent, updateEvent } from "@/app/(app)/events/actions";
import {
  CoverImageField,
  COVER_MIME_EXT,
  type CoverValue,
} from "@/components/event/cover-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { eventFormSchema, type EventFormInput } from "@/lib/validations/event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EventFormProps {
  /** 복제/수정 진입 시 미리 채울 값 */
  defaultValues?: Partial<EventFormInput>;
  /** 수정 모드면 대상 이벤트 id. 없으면 새로 만듭니다. */
  eventId?: string;
  /** 수정 모드에서 현재 커버의 서명 URL (미리보기용) */
  coverUrl?: string | null;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

// 이벤트 생성/수정 폼 (F001). 서버 액션으로 저장합니다.
// 주간 반복은 MVP 범위 밖이라 화면에 없습니다. (스키마의 recurrence 입력과 서버의 거부 처리는 유지)
export function EventForm({
  defaultValues,
  eventId,
  coverUrl,
}: EventFormProps) {
  const router = useRouter();
  const isEdit = !!eventId;
  const [cover, setCover] = useState<CoverValue>({
    file: null,
    removeExisting: false,
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startsAt: "",
      location: "",
      capacity: 10,
      rsvpDeadline: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: EventFormInput) {
    // 새 파일이 있으면 브라우저에서 Storage로 먼저 올리고, 서버 액션에는 경로만 넘깁니다.
    let uploadedPath: string | null = null;
    if (cover.file) {
      const supabase = createClient();
      const { data: claims } = await supabase.auth.getClaims();
      const userId = claims?.claims.sub;
      const ext = COVER_MIME_EXT[cover.file.type];
      if (!userId || !ext) {
        toast.error("이미지를 업로드하지 못했어요. 다시 로그인해 주세요.");
        return;
      }
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("event-covers")
        .upload(path, cover.file, {
          contentType: cover.file.type,
          upsert: false,
        });
      if (error) {
        toast.error(
          "이미지를 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }
      uploadedPath = path;
    }

    // 새 파일 > 제거 > 기존 경로 유지 순서로 저장할 경로를 정합니다.
    const coverImagePath =
      uploadedPath ??
      (cover.removeExisting ? null : (defaultValues?.coverImagePath ?? null));
    const input = { ...values, coverImagePath };

    const result = eventId
      ? await updateEvent(eventId, input)
      : await createEvent(input);

    if (!result.success) {
      // 저장에 실패했으니 방금 올린 파일이 고아가 되지 않게 지웁니다. (실패해도 무시)
      if (uploadedPath) {
        try {
          await createClient()
            .storage.from("event-covers")
            .remove([uploadedPath]);
        } catch {
          // best-effort
        }
      }
      // 서버 검증 오류는 해당 필드에 표시하고, 그 외는 토스트로 알립니다.
      let mapped = false;
      for (const [name, messages] of Object.entries(result.errors ?? {})) {
        if (messages?.[0]) {
          setError(name as keyof EventFormInput, { message: messages[0] });
          mapped = true;
        }
      }
      if (!mapped) toast.error(result.message);
      return;
    }

    toast.success(isEdit ? "이벤트를 수정했어요." : "이벤트를 만들었어요.");
    router.push(`/events/${result.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          className="h-11"
          placeholder="예: 금요 풋살 모임"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        <FieldError id="title" message={errors.title?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="준비물, 모이는 방법 등을 적어 주세요."
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          {...register("description")}
        />
        <FieldError id="description" message={errors.description?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startsAt">일시</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          className="h-11"
          aria-invalid={!!errors.startsAt}
          aria-describedby={errors.startsAt ? "startsAt-error" : undefined}
          {...register("startsAt")}
        />
        <FieldError id="startsAt" message={errors.startsAt?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          className="h-11"
          placeholder="예: 성수 풋살파크"
          aria-invalid={!!errors.location}
          aria-describedby={errors.location ? "location-error" : undefined}
          {...register("location")}
        />
        <FieldError id="location" message={errors.location?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">정원 (명)</Label>
        <Input
          id="capacity"
          type="number"
          inputMode="numeric"
          min={1}
          className="h-11"
          aria-invalid={!!errors.capacity}
          aria-describedby={errors.capacity ? "capacity-error" : undefined}
          {...register("capacity", { valueAsNumber: true })}
        />
        <FieldError id="capacity" message={errors.capacity?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rsvpDeadline">신청 마감 (선택)</Label>
        <Input
          id="rsvpDeadline"
          type="datetime-local"
          className="h-11"
          aria-invalid={!!errors.rsvpDeadline}
          aria-describedby={
            errors.rsvpDeadline ? "rsvpDeadline-error" : undefined
          }
          {...register("rsvpDeadline")}
        />
        <FieldError id="rsvpDeadline" message={errors.rsvpDeadline?.message} />
      </div>

      <CoverImageField
        value={cover}
        onChange={setCover}
        existingUrl={coverUrl}
        disabled={isSubmitting}
      />

      <Button type="submit" className="h-11" disabled={isSubmitting}>
        {isEdit ? "수정 저장" : "이벤트 만들기"}
      </Button>
    </form>
  );
}
