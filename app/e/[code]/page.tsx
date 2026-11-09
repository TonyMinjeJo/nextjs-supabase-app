import { CapacityGauge } from "@/components/event/capacity-gauge";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { RsvpButtons } from "@/components/event/rsvp-buttons";
import { getEventInvite } from "@/lib/data/events";
import { getMyParticipationByCode } from "@/lib/data/participations";
import { formatEventDate } from "@/lib/format";
import { getNowMs } from "@/lib/now";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function InviteContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // 신청 마감 판단에 현재 시각을 쓰므로 요청 시점에 렌더링합니다.
  await connection();
  const { code } = await params;

  // 공개 요약은 get_event_invite RPC로만 조회합니다. (host_id, 계좌, 참석자 목록 미노출)
  const [event, user, mine] = await Promise.all([
    getEventInvite(code),
    getSessionUser(),
    // 재방문 시 내 응답 상태. 비로그인/비멤버(응답 전)는 null
    getMyParticipationByCode(code),
  ]);
  if (!event) notFound();

  const isLoggedIn = !!user;
  // 이메일 로그인·회원가입 후 이 초대 화면으로 돌아오기 위한 next 쿼리 값
  const authNext = encodeURIComponent(`/e/${encodeURIComponent(code)}`);
  const closed =
    event.rsvp_deadline !== null &&
    Date.parse(event.rsvp_deadline) < getNowMs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <CardDescription>
          {event.host_name ? `주최 ${event.host_name} · ` : ""}
          초대 링크로 도착했어요
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[4rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">일시</dt>
          <dd>{formatEventDate(event.starts_at)}</dd>
          <dt className="text-muted-foreground">장소</dt>
          <dd>{event.location}</dd>
          {event.rsvp_deadline && (
            <>
              <dt className="text-muted-foreground">마감</dt>
              <dd>{formatEventDate(event.rsvp_deadline)}</dd>
            </>
          )}
        </dl>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        <CapacityGauge current={event.going_count} capacity={event.capacity} />

        {isLoggedIn ? (
          <div className="flex flex-col gap-3">
            {event.canceled ? (
              <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
                취소된 이벤트예요. 더 이상 응답할 수 없어요.
              </p>
            ) : (
              <RsvpButtons
                code={code}
                initialStatus={mine?.status ?? null}
                waitlistOrder={mine?.waitlistOrder ?? null}
                goingCount={event.going_count}
                capacity={event.capacity}
                closed={closed}
              />
            )}
            {/* 응답한 멤버(주최자 포함)에게만 상세 링크를 보여줍니다. */}
            {mine && mine.status !== null && (
              <Button asChild variant="outline" className="h-11">
                <Link href={`/events/${encodeURIComponent(mine.eventId)}`}>
                  이벤트 상세 보기
                </Link>
              </Button>
            )}
          </div>
        ) : event.canceled ? (
          <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
            취소된 이벤트예요. 더 이상 응답할 수 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-muted-foreground">
              참석 응답을 하려면 로그인이 필요해요.
            </p>
            <GoogleSignInButton
              next={`/e/${encodeURIComponent(code)}`}
              label="Google로 로그인하고 참여하기"
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              또는
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button asChild variant="outline" className="h-11 w-full">
              <Link href={`/auth/login?next=${authNext}`}>
                이메일로 로그인하고 참여하기
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link
                href={`/auth/sign-up?next=${authNext}`}
                className="underline underline-offset-4"
              >
                이메일로 회원가입
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 이벤트 초대 (F002) - 공개 요약 + 로그인 유도 + 참석 응답(로그인 시)
export default function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <InviteContent params={params} />
    </Suspense>
  );
}
