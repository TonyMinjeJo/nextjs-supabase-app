import type { CarpoolRide } from "./carpool";
import type { MeetupEvent } from "./event";
import type { ParticipationStatus } from "./participation";
import type { PaymentStatus } from "./settlement";

// 화면 컴포넌트와 더미 데이터(lib/mocks)가 공유하는 Props/뷰 모델 타입 초안.
// Task 005-1 UI 검토 결과에 따라 보완될 수 있습니다.

/** 이벤트 카드 (내 이벤트 목록) */
export interface EventCardProps {
  event: Pick<
    MeetupEvent,
    | "id"
    | "title"
    | "starts_at"
    | "location"
    | "capacity"
    | "share_code"
    | "cover_image_path"
    | "canceled_at"
  >;
  /** 현재 참석(going) 인원 */
  goingCount: number;
  /** 내가 주최한 이벤트인지 */
  isHost: boolean;
  /** 내 참석 상태 (응답 전이면 null) */
  myStatus: ParticipationStatus | null;
}

/** 참석자 목록 행 */
export interface ParticipantRowProps {
  userId: string;
  name: string;
  avatarUrl: string | null;
  status: ParticipationStatus;
  attended: boolean;
  /** 대기 순번 (status가 waitlist일 때만) */
  waitlistOrder?: number;
}

/** 카풀 운행 카드 */
export interface RideCardProps {
  ride: CarpoolRide;
  driverName: string;
  /** 수락된 탑승자 수 */
  acceptedCount: number;
  /** 남은 좌석 (seats - acceptedCount) */
  remainingSeats: number;
}

/** 정산 분담 행 */
export interface SettlementRowProps {
  userId: string;
  name: string;
  /** 1인당 분담 금액 (정수 원 단위) */
  amount: number;
  paymentStatus: PaymentStatus;
}
