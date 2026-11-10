import { LoadingState } from "@/components/loading-state";
import { UserTable } from "@/components/admin/user-table";
import { getAdminUserRows } from "@/lib/mocks/admin";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "사용자 관리" };

async function UsersContent() {
  return <UserTable rows={getAdminUserRows()} />;
}

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">사용자</h1>
      <Suspense fallback={<LoadingState />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}
