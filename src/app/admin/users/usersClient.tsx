"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { User } from "@/shared/lib/generated/prisma/browser";
import { UserActiveToggle } from "./_components/toggle-active";
import { UserRoleToggle } from "./_components/toggle-role";

type UsersResponse = Awaited<
  ReturnType<typeof import("@/actions/admin/users").getUsers>
>;

type Props = {
  initialData: UsersResponse;
  currentUserId: string;
};

export default function UsersClient({ initialData, currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>(initialData.users || []);
  const [total, setTotal] = useState(initialData.total || users.length);
  const [page, setPage] = useState(initialData.page || 1);
  const [pageSize, setPageSize] = useState(initialData.pageSize || 20);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [blocked, setBlocked] = useState<"all" | "blocked" | "unblocked">(
    "all",
  );
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  const fetchUsers = useCallback(
    async (opts?: { page?: number; pageSize?: number }) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (role !== "all") params.set("role", role);
        if (status === "active") params.set("isActive", "true");
        if (status === "inactive") params.set("isActive", "false");
        if (blocked === "blocked") params.set("isBlocked", "true");
        if (blocked === "unblocked") params.set("isBlocked", "false");
        params.set("page", String(opts?.page ?? page));
        params.set("pageSize", String(opts?.pageSize ?? pageSize));

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to fetch users");
          return;
        }
        const data = (await res.json()) as UsersResponse;
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setPageSize(data.pageSize || 20);
      } catch {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [search, role, status, blocked, page, pageSize],
  );

  useEffect(() => {
    setUsers(initialData.users || []);
    setTotal(initialData.total || 0);
    setPage(initialData.page || 1);
    setPageSize(initialData.pageSize || 20);
  }, [initialData]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const applyFilters = () => {
    void fetchUsers({ page: 1, pageSize });
  };

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setBlocked("all");
    void fetchUsers({ page: 1, pageSize });
  };

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    void fetchUsers({ page: next, pageSize });
  };

  const activeCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );
  const blockedCount = useMemo(
    () => users.filter((u) => u.isBlocked).length,
    [users],
  );
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "ADMIN").length,
    [users],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-xs mb-1 block">Search</label>
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email or phone"
          />
        </div>
        <div className="w-full md:w-40">
          <label className="text-xs mb-1 block">Role</label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as typeof role)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-40">
          <label className="text-xs mb-1 block">Status</label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-40">
          <label className="text-xs mb-1 block">Blocked</label>
          <Select
            value={blocked}
            onValueChange={(value) => setBlocked(value as typeof blocked)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="unblocked">Unblocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={applyFilters} disabled={loading}>
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Total users: {total}</span>
        <span>Active: {activeCount}</span>
        <span>Blocked: {blockedCount}</span>
        <span>Admins: {adminCount}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[60vh]">
        {users.length > 0 ? (
          users.map((user) => (
            <Card
              key={user.id}
              className="p-4 space-y-2 max-h-[45%] flex flex-col items-start justify-center"
            >
              <div className="w-full flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="uppercase">
                    {(user?.name as string | null)?.slice(0, 2) ||
                      user.email.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <div className="w-full flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{user.name}</h2>
                    <UserRoleToggle
                      userId={user.id}
                      role={user.role as "ADMIN" | "USER"}
                      disabled={
                        user.id === currentUserId ||
                        user.email === "mzeeshankhan0988@gmail.com"
                      }
                    />
                    {user.isPlusMember && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700">
                        Plus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {user.id.slice(0, 8)}…
                  </p>
                </div>
              </div>

              <div className="w-full flex items-center justify-between text-xs mt-2">
                <div className="space-y-1">
                  <p>
                    Created:{" "}
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {user.updatedAt && (
                    <p>
                      Updated:{" "}
                      {new Date(user.updatedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  {user.plusUntil && (
                    <p>
                      Plus until:{" "}
                      {new Date(user.plusUntil).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <UserActiveToggle
                    userId={user.id}
                    isActive={!!user.isActive}
                    disabled={
                      user.id === currentUserId ||
                      user.email === "mzeeshankhan0988@gmail.com"
                    }
                  />

                  <div className="text-xs">
                    <span
                      className={
                        user.isBlocked
                          ? "text-red-600 font-medium"
                          : "text-emerald-600 font-medium"
                      }
                    >
                      {user.isBlocked ? "Blocked" : "Allowed"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const size = Number(value);
              setPageSize(size);
              void fetchUsers({ page: 1, pageSize: size });
            }}
          >
            <SelectTrigger className="h-7 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
