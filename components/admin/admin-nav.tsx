"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/events", label: "이벤트", exact: false },
  { href: "/admin/users", label: "사용자", exact: false },
];

// admin 내비게이션: lg 이상은 세로 사이드바, 미만은 가로 탭으로 보입니다.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex gap-1 overflow-x-auto lg:flex-col"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/events"
        className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent lg:mt-4 lg:border-t lg:pt-4"
      >
        서비스로 돌아가기
      </Link>
    </nav>
  );
}
