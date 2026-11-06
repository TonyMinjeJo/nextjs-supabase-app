"use client";

import { EmptyState } from "@/components/event/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminUserRow } from "@/lib/mocks/admin";
import { useState } from "react";

interface UserTableProps {
  rows: AdminUserRow[];
}

function RoleBadge({ role }: { role: AdminUserRow["role"] }) {
  return role === "admin" ? (
    <Badge>admin</Badge>
  ) : (
    <Badge variant="outline">일반</Badge>
  );
}

// 운영자 사용자 표: lg 이상은 table, 그 미만은 카드 목록
export function UserTable({ rows }: UserTableProps) {
  const [query, setQuery] = useState("");

  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? rows.filter((row) => row.name.toLowerCase().includes(keyword))
    : rows;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="admin-user-search" className="sr-only">
          이름 검색
        </Label>
        <Input
          id="admin-user-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 검색"
          className="h-11"
        />
      </div>

      <p className="sr-only" role="status">
        {filtered.length}명의 사용자
      </p>

      {filtered.length === 0 ? (
        <EmptyState message="조건에 맞는 사용자가 없습니다." />
      ) : (
        <>
          {/* lg 이상: 표 */}
          <div className="hidden overflow-hidden rounded-lg border lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                사용자 목록: 이름, 역할, 주최 수, 참여 수
              </caption>
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    이름
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    역할
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    주최 수
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    참여 수
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="px-3 py-3 font-medium">
                      {row.name}
                    </th>
                    <td className="px-3 py-3">
                      <RoleBadge role={row.role} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.hostedCount}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.joinedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* lg 미만: 카드 목록 */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {filtered.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground"
              >
                <div className="flex min-h-11 items-center justify-between gap-2">
                  <span className="font-semibold break-words">{row.name}</span>
                  <RoleBadge role={row.role} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">주최</dt>
                    <dd className="tabular-nums">{row.hostedCount}건</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">참여</dt>
                    <dd className="tabular-nums">{row.joinedCount}건</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
