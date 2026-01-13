"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { checkEmail } from "@/actions/auth/login";
import { loginFormSchemaEmail } from "@/shared/lib/schemas";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import ErrorAlert from "../ui/error-alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import SuccessAlert from "../ui/success-alert";
import OAuth from "./o-auth";

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (success) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
    if (error) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsErrorVisible(false);
    }
  }, [success, error]);

  const form = useForm<z.infer<typeof loginFormSchemaEmail>>({
    resolver: zodResolver(loginFormSchemaEmail),
    defaultValues: {
      email: "",
    },
  });
  const onSubmit = async (values: z.infer<typeof loginFormSchemaEmail>) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await checkEmail(values.email);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.success) {
        setSuccess(res.success);
        setIsVisible(true);
        setTimeout(() => {
          router.push("/auth/sign-in/factor-one");
        }, 1200);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
      if (success) {
        setIsVisible(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }

      if (error) {
        setIsErrorVisible(true);
        const timer = setTimeout(() => {
          setIsErrorVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        setIsErrorVisible(false);
      }
    }
  };

  return (
    <Card className="w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Welcome back! Please sign in to continue
        </CardDescription>
        {isVisible && <SuccessAlert success={success} />}
        {isErrorVisible && <ErrorAlert error={error} />}
      </CardHeader>
      <CardContent className="grid gap-6">
        <OAuth setError={setError} />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader size={17} className="animate-spin" />
              ) : (
                <> Continue </>
              )}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
