"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleUserActive } from "@/actions/admin/users";

type Props = {
  userId: string;
  isActive: boolean;
  disabled: boolean;
};

export function UserActiveToggle({ userId, isActive, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  if (disabled) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Active</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          defaultChecked={isActive}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.checked;

            startTransition(async () => {
              const res = await toggleUserActive(userId, value);

              if (!res) {
                toast.error("Failed to update user");
              }
              toast.success(`User ${value ? "activated" : "deactivated"}`);
            });
          }}
        />

        {/* Track */}
        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>

        {/* Dot */}
        <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4"></span>
      </label>
    </div>
  );
}
