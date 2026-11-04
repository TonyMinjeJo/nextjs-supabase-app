import { CapacityGauge } from "@/components/event/capacity-gauge";
import { RsvpButtons } from "@/components/event/rsvp-buttons";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEventDate } from "@/lib/format";
import {
  CURRENT_USER_ID,
  getEventByCode,
  getGoingCount,
  getMyStatus,
  getUserName,
} from "@/lib/mocks";
import { getNowMs } from "@/lib/now";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

async function InviteContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // 신청 마감 판단에 현재 시각을 쓰므로 요청 시점에 렌더링합니다.
  await connection();
  const { code } = await params;

  const event = getEventByCode(decodeURIComponent(code));
  if (!event) notFound();

  let isLoggedIn = false;
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    isLoggedIn = !!data?.claims;
  }

  const goingCount = getGoingCount(event.id);
  const closed =
    event.rsvp_deadline !== null &&
    Date.parse(event.rsvp_deadline) < getNowMs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <CardDescription>
          주최 {getUserName(event.host_id)} · 초대 링크로 도착했어요
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
        <CapacityGauge current={goingCount} capacity={event.capacity} />

        {isLoggedIn ? (
          <>
            <RsvpButtons
              initialStatus={getMyStatus(event.id, CURRENT_USER_ID)}
              goingCount={goingCount}
              capacity={event.capacity}
              closed={closed}
            />
            <Button asChild variant="ghost" className="h-11">
              <Link href={`/events/${encodeURIComponent(event.id)}`}>
                이벤트 상세 보기
              </Link>
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-muted-foreground">
              참석 응답을 하려면 로그인이 필요해요.
            </p>
            <GoogleSignInButton
              next={`/e/${encodeURIComponent(code)}`}
              label="Google로 로그인하고 참여하기"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 이벤트 초대 (F002, F004) - 공개 요약 + 로그인 유도
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
