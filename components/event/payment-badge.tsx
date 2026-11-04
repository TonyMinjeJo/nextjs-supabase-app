import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

// 입금 상태: 미입금 → 입금 표시(참여자) → 확인 완료(주최자)
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "confirmed":
      return <Badge>확인 완료</Badge>;
    case "marked":
      return <Badge variant="secondary">입금 표시</Badge>;
    default:
      return <Badge variant="outline">미입금</Badge>;
  }
}
