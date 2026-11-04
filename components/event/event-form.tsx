"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { eventFormSchema, type EventFormInput } from "@/lib/validations/event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DEFAULT_WEEKDAY = 5;

interface EventFormProps {
  /** 복제 진입 시 미리 채울 값 */
  defaultValues?: Partial<EventFormInput>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

// 이벤트 생성 폼 (F001, F008). 제출은 DB 없이 안내 후 목록으로 이동하는 더미 동작입니다.
export function EventForm({ defaultValues }: EventFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setValue,
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
      recurrence: undefined,
      ...defaultValues,
    },
  });
  const recurrence = useWatch({ control, name: "recurrence" });

  function onSubmit(values: EventFormInput) {
    toast.success("이벤트를 만들었어요.", {
      description: `"${values.title}" (더미 데이터라 실제로 저장되지는 않아요)`,
    });
    router.push("/events");
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
          {...register("title")}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="준비물, 모이는 방법 등을 적어 주세요."
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startsAt">일시</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          className="h-11"
          aria-invalid={!!errors.startsAt}
          {...register("startsAt")}
        />
        <FieldError message={errors.startsAt?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          className="h-11"
          placeholder="예: 성수 풋살파크"
          aria-invalid={!!errors.location}
          {...register("location")}
        />
        <FieldError message={errors.location?.message} />
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
          {...register("capacity", { valueAsNumber: true })}
        />
        <FieldError message={errors.capacity?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rsvpDeadline">신청 마감 (선택)</Label>
        <Input
          id="rsvpDeadline"
          type="datetime-local"
          className="h-11"
          aria-invalid={!!errors.rsvpDeadline}
          {...register("rsvpDeadline")}
        />
        <FieldError message={errors.rsvpDeadline?.message} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="recurrence"
            checked={!!recurrence}
            onCheckedChange={(checked) =>
              setValue(
                "recurrence",
                checked === true
                  ? { weekday: DEFAULT_WEEKDAY, endDate: "" }
                  : undefined,
              )
            }
          />
          <Label htmlFor="recurrence">매주 반복하기</Label>
        </div>

        {recurrence && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weekday">반복 요일</Label>
              <Controller
                control={control}
                name="recurrence.weekday"
                render={({ field }) => (
                  <Select
                    value={String(field.value ?? DEFAULT_WEEKDAY)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger id="weekday" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((label, index) => (
                        <SelectItem key={label} value={String(index)}>
                          {label}요일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">반복 종료일</Label>
              <Input
                id="endDate"
                type="date"
                className="h-11"
                aria-invalid={!!errors.recurrence?.endDate}
                {...register("recurrence.endDate")}
              />
              <FieldError message={errors.recurrence?.endDate?.message} />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="h-11" disabled={isSubmitting}>
        이벤트 만들기
      </Button>
    </form>
  );
}
