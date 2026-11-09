"use client";

import { CoverImage } from "@/components/event/cover-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";

// 이벤트 커버 이미지 선택 필드. 파일은 여기서 고르기만 하고,
// 실제 업로드는 폼 제출 시 EventForm이 합니다.

export const COVER_MAX_BYTES = 5 * 1024 * 1024;

/** 허용 MIME → 확장자. 확장자는 파일명이 아니라 MIME에서 결정합니다. */
export const COVER_MIME_EXT: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface CoverValue {
  /** 새로 고른 파일 (업로드 대기) */
  file: File | null;
  /** 기존 커버를 제거할지 (수정 모드) */
  removeExisting: boolean;
}

interface CoverImageFieldProps {
  value: CoverValue;
  onChange: (value: CoverValue) => void;
  /** 수정 모드에서 현재 저장된 커버의 서명 URL */
  existingUrl?: string | null;
  disabled?: boolean;
}

export function CoverImageField({
  value,
  onChange,
  existingUrl,
  disabled,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 현재 미리보기 URL. 교체·취소·언마운트 때 revokeObjectURL로 해제합니다.
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPreview(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewRef.current = url;
    setPreviewUrl(url);
  }

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(file.type in COVER_MIME_EXT)) {
      setError("JPG, PNG, WebP 이미지만 올릴 수 있어요.");
      resetInput();
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setError("이미지는 5MB 이하만 올릴 수 있어요.");
      resetInput();
      return;
    }
    setError(null);
    setPreview(file);
    onChange({ file, removeExisting: false });
  }

  function handleRemove() {
    setError(null);
    resetInput();
    setPreview(null);
    // 새 파일을 취소하면 기존 커버로 되돌아가고, 기존 커버를 지우면 제거로 표시합니다.
    onChange({ file: null, removeExisting: !value.file && !!existingUrl });
  }

  const shownUrl = previewUrl ?? (value.removeExisting ? null : existingUrl);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="coverImage">커버 이미지 (선택)</Label>
      {shownUrl && (
        <div className="flex flex-col gap-2">
          <CoverImage
            src={shownUrl}
            alt="커버 이미지 미리보기"
            className="rounded-lg border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full"
            onClick={handleRemove}
            disabled={disabled}
          >
            {value.file ? "선택 취소" : "커버 제거"}
          </Button>
        </div>
      )}
      <Input
        ref={inputRef}
        id="coverImage"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="h-11 min-w-0"
        aria-invalid={!!error}
        disabled={disabled}
        onChange={handleSelect}
      />
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP · 최대 5MB</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
