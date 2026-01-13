"use client";

import { Loader, TriangleAlert } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { updateEmail } from "@/actions/profile/update-email";
import { sendVerification } from "@/actions/send-verification";
import VerifyCode from "../auth/verify-code";
import { useAuth } from "../auth-provider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const EmailForm = ({ cancel }: { cancel: () => void }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const { update } = useAuth();
  const hundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setIsLoading(true);
      if (email == "") {
        setError("Please enter email");
        return;
      }
      await sendVerification(email);
      setVerifyEmail(true);
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  const onSuccess = async () => {
    setTimeout(() => {
      setVerifyEmail(false);
    }, 1000);
    update({ email });
  };
  return (
    <div>
      <form
        className="space-y-4 bg-secondary/50 rounded-lg p-4"
        onSubmit={hundleSubmit}
      >
        <div>
          <h4 className="font-medium">Update email address</h4>
          <div className="text-sm flex  text-orange-500 mt-2">
            {" "}
            <TriangleAlert className="inline-flex self-center mr-1" size={16} />
            <p>
              You'll need to verify this email address before it can be added to
              your account.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && (
          <div className="bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 ">
            <TriangleAlert className="text-destructive/60" />
            <div className="text-left">
              <h4 className="text-xs font-medium">Error</h4>
              <p className="text-xm opacity-70">{error}</p>
            </div>
          </div>
        )}
        <div className="flex justify-end items-center gap-2">
          <Button
            disabled={isLoading}
            type="button"
            onClick={cancel}
            variant={"outline"}
            className="min-w-20"
          >
            Cancel{" "}
          </Button>
          <Button disabled={isLoading} className="min-w-20">
            Update {isLoading && <Loader className="animate-spin" />}
          </Button>
        </div>
      </form>
      {verifyEmail && (
        <div className="absolute h-full w-full inset-0 bg-black/20 z-20 grid place-content-center">
          <VerifyCode
            email={email}
            title="Verify your email"
            onVerify={(code) => updateEmail(email, code)}
            onSuccess={onSuccess}
          />{" "}
        </div>
      )}
    </div>
  );
};

export default EmailForm;
