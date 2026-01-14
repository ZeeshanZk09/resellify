"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { toggleUserRole } from "@/actions/admin/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type Props = {
  userId: string;
  role: "ADMIN" | "USER";
  disabled?: boolean;
};

export function UserRoleToggle({ userId, role: initialRole, disabled }: Props) {
  const [role, setRole] = useState(initialRole);
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase bg-slate-100 text-slate-700">
        {role.toLowerCase()}
      </span>
    );
  }

  return (
    <Select
      value={role}
      onValueChange={(value) => {
        const newRole = value as "ADMIN" | "USER";
        setRole(newRole); // Optimistic update
        
        startTransition(async () => {
          const res = await toggleUserRole(userId, newRole);
          if (!res.success) {
            toast.error(res.message);
            setRole(initialRole); // Revert on failure
          } else {
            toast.success(res.message);
          }
        });
      }}
      disabled={isPending}
    >
      <SelectTrigger className="h-6 text-[10px] uppercase px-2 py-0.5 w-auto gap-1 border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-0">
        <SelectValue placeholder={role} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">User</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
