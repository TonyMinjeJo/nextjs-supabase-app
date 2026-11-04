import type { Event, EventCardProps } from "@/lib/types";
import { getGoingCount, getMyStatus, participations } from "./participations";

// 시각은 한국 시간(+09:00) ISO 문자열. 예정/지난 구분은 화면에서 현재 시각과 비교합니다.
export const events: Event[] = [
  {
    id: "e1",
    host_id: "u1",
    series_id: null,
    title: "금요 풋살 모임",
    description: "실내 구장에서 풋살을 합니다. 실내화를 챙겨 주세요.",
    starts_at: "2026-11-13T19:00:00+09:00",
    location: "성수 풋살파크 B코트",
    capacity: 8,
    rsvp_deadline: "2026-11-12T18:00:00+09:00",
    share_code: "futsal1114",
  },
  {
    id: "e2",
    host_id: "u2",
    series_id: null,
    title: "북한산 가을 산행",
    description: "구기동 입구에서 출발해 대남문까지 오릅니다.",
    starts_at: "2026-11-21T09:00:00+09:00",
    location: "북한산 구기분소",
    capacity: 10,
    rsvp_deadline: null,
    share_code: "hike1121",
  },
  {
    id: "e3",
    host_id: "u2",
    series_id: null,
    title: "송년 보드게임 파티",
    description: null,
    starts_at: "2026-12-05T18:30:00+09:00",
    location: "홍대 보드게임 카페",
    capacity: 6,
    rsvp_deadline: "2026-12-01T23:59:00+09:00",
    share_code: "board1205",
  },
  {
    id: "e4",
    host_id: "u1",
    series_id: "s1",
    title: "10월 정기 풋살",
    description: "매주 금요일 정기 모임",
    starts_at: "2026-10-16T19:00:00+09:00",
    location: "성수 풋살파크 A코트",
    capacity: 6,
    rsvp_deadline: null,
    share_code: "futsal1018",
  },
  {
    id: "e5",
    host_id: "u3",
    series_id: null,
    title: "한강 러닝 크루",
    description: null,
    starts_at: "2026-10-04T07:00:00+09:00",
    location: "반포 한강공원",
    capacity: 8,
    rsvp_deadline: null,
    share_code: "run1004",
  },
];

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

export function getEventByCode(code: string): Event | undefined {
  return events.find((event) => event.share_code === code);
}

/** 내 이벤트: 내가 주최했거나 참석 응답을 남긴 이벤트 (시작 시각 내림차순) */
export function getMyEvents(userId: string): EventCardProps[] {
  return events
    .filter(
      (event) =>
        event.host_id === userId ||
        participations.some(
          (item) => item.event_id === event.id && item.user_id === userId,
        ),
    )
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))
    .map((event) => ({
      event: {
        id: event.id,
        title: event.title,
        starts_at: event.starts_at,
        location: event.location,
        capacity: event.capacity,
        share_code: event.share_code,
      },
      goingCount: getGoingCount(event.id),
      isHost: event.host_id === userId,
      myStatus: getMyStatus(event.id, userId),
    }));
}
