import { UserTable } from "@/components/admin/user-table";
import { getAdminUserRows } from "@/lib/mocks/admin";
import { Suspense } from "react";

async function UsersContent() {
  return <UserTable rows={getAdminUserRows()} />;
}

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">사용자</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <UsersContent />
      </Suspense>
    </div>
  );
}
