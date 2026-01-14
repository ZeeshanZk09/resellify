import { Search, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUsers } from "@/actions/admin/users";
import UsersClient from "./usersClient";

export const dynamic = "force-dynamic";

export default async function Users() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initial = await getUsers({
    page: 1,
    pageSize: 20,
  });

  return (
    <div className="p-0 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Search, filter and manage users</span>
        </div>
      </div>
      <UsersClient initialData={initial} currentUserId={session.user.id} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3 w-3" />
        <span>
          Use filters to narrow by role, status, and activity; pagination keeps
          responses fast.
        </span>
      </div>
    </div>
  );
}
