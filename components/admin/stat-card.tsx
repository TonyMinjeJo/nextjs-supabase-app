import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  /** 표시용으로 이미 포맷된 값 */
  value: string;
  /** 값 아래 보조 설명 */
  description?: string;
}

// 대시보드 통계 카드. 값 계산은 호출 측(집계 함수) 결과를 그대로 받습니다.
export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-2xl font-bold">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
