import type {
  ParticipantRowProps,
  Participation,
  ParticipationStatus,
} from "@/lib/types";
import { getUserName } from "./users";

// 더미 응답 시각: 선언 순서대로 1분씩 늘어납니다. (대기 순번은 created_at 오름차순)
let seq = 0;
const nextCreatedAt = () => {
  const minutes = seq++;
  const hour = String(9 + Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `2026-10-01T${hour}:${minute}:00+09:00`;
};

const p = (
  event_id: string,
  user_id: string,
  status: ParticipationStatus,
  attended = false,
): Participation => ({
  event_id,
  user_id,
  status,
  attended,
  created_at: nextCreatedAt(),
});

export const participations: Participation[] = [
  // e1: 정원 8명이 가득 찬 이벤트 (대기 2명), 내가 주최
  p("e1", "u1", "going"),
  p("e1", "u2", "going"),
  p("e1", "u3", "going"),
  p("e1", "u4", "going"),
  p("e1", "u5", "going"),
  p("e1", "u6", "going"),
  p("e1", "u7", "going"),
  p("e1", "u8", "going"),
  p("e1", "u9", "waitlist"),
  p("e1", "u10", "waitlist"),
  // e2: 내가 참여자 (카풀 있음)
  p("e2", "u2", "going"),
  p("e2", "u1", "going"),
  p("e2", "u3", "going"),
  p("e2", "u4", "going"),
  p("e2", "u5", "going"),
  p("e2", "u6", "not_going"),
  // e3: 내가 아직 응답하지 않은 이벤트 (초대 링크 진입용)
  p("e3", "u2", "going"),
  p("e3", "u3", "going"),
  p("e3", "u4", "going"),
  // e4: 지난 이벤트, 내가 주최, 정산 진행 중
  p("e4", "u1", "going", true),
  p("e4", "u2", "going", true),
  p("e4", "u3", "going", true),
  p("e4", "u4", "going"),
  p("e4", "u5", "going"),
  // e5: 지난 이벤트, 내가 참여자 (정산 대상)
  p("e5", "u3", "going", true),
  p("e5", "u4", "going", true),
  p("e5", "u5", "going", true),
  p("e5", "u1", "going", true),
  p("e5", "u6", "not_going"),
];

export function getParticipations(eventId: string): Participation[] {
  return participations.filter((item) => item.event_id === eventId);
}

export function getMyStatus(
  eventId: string,
  userId: string,
): ParticipationStatus | null {
  return (
    participations.find(
      (item) => item.event_id === eventId && item.user_id === userId,
    )?.status ?? null
  );
}

export function getGoingCount(eventId: string): number {
  return getParticipations(eventId).filter((item) => item.status === "going")
    .length;
}

/** 참석자 목록 행 (참석, 대기, 불참 순) */
export function getParticipantRows(eventId: string): ParticipantRowProps[] {
  const order: Record<ParticipationStatus, number> = {
    going: 0,
    waitlist: 1,
    not_going: 2,
  };
  let waitlistOrder = 0;
  // 먼저 응답한 순으로 정렬한 뒤 대기 순번을 매깁니다.
  return [...getParticipations(eventId)]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map((item) => ({
      userId: item.user_id,
      name: getUserName(item.user_id),
      avatarUrl: null,
      status: item.status,
      attended: item.attended,
      waitlistOrder: item.status === "waitlist" ? ++waitlistOrder : undefined,
    }))
    .sort((a, b) => order[a.status] - order[b.status]);
}
