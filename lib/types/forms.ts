// 서버 액션 공통 반환 타입. (docs/guides/forms-react-hook-form.md)

export interface ActionFailure {
  success: false;
  message: string;
  /** 필드별 오류 메시지 (Zod flattenError().fieldErrors) */
  errors?: Record<string, string[] | undefined>;
}

export type ActionResult<T> = { success: true; data: T } | ActionFailure;
