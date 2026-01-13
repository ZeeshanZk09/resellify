"use client";

import { CircleCheckBig, TriangleAlert } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { updatePassword } from "@/actions/profile/update-password";
import { useAuth } from "../auth-provider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const PasswordForm = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setIsLoading(true);

    try {
      // Simulate API request (replace with actual API call)
      const res = await updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(res?.success || "password  updated successfully!");
    } catch (error) {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user?.password ? (
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      ) : (
        <p className="text-sm opacity-60 mb-5">
          You're using a third-party login. Set a password below if needed.
        </p>
      )}

      <div
        className={` grid gap-4 ${user?.password ? " md:grid-cols-2" : ""} `}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>
      {success && (
        <div className="bg-green-100 rounded-lg p-3 items-center mt-4 flex gap-4 ">
          <CircleCheckBig className="text-green-500" />
          <div className="text-left">
            <h4 className="text-xs font-medium">success</h4>
            <p className="text-xm opacity-70">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 ">
          <TriangleAlert className="text-destructive/60" />
          <div className="text-left">
            <h4 className="text-xs font-medium">Error</h4>
            <p className="text-xm opacity-70">{error}</p>
          </div>
        </div>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
};

export default PasswordForm;
