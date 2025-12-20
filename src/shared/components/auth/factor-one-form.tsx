"use client";
import { Eye, EyeOff, Loader, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchemaPassword } from "@/shared/lib/schemas";
import { z } from "zod";
import { sendCodeForPasswordReset } from "@/actions/auth/resset-password";
import { login } from "@/actions/auth/login";
import { useRouter } from "next/navigation";
import SuccessAlert from "../ui/success-alert";
import ErrorAlert from "../ui/error-alert";
type Props = {
  email: string;
};
const FactorOneForm = ({ email }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<z.infer<typeof loginFormSchemaPassword>>({
    resolver: zodResolver(loginFormSchemaPassword),
    defaultValues: {
      password: "",
    },
  });
  const handleForgetPassword = async () => {
    setSuccess(null);
    setIsLoading(true);
    setError("");
    try {
      const res = await sendCodeForPasswordReset();
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.success) {
        setSuccess(res.success);
        router.push("/auth/sign-in/reset-password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof loginFormSchemaPassword>) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await login(values.password);
      if (res.error) {
        setError(res?.error || "Something went wrong");
        return;
      }
      if (res.success) {
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className="w-full max-w-sm ">
      <CardHeader className="text-center">
        <CardTitle className="text-xl"> Enter your password</CardTitle>
        <CardDescription>
          <span>Enter the password associated with your account {email}</span>
          <button
            onClick={() => router.back()}
            className="cursor-pointer inline-flex p-1 align-middle opacity-70 hover:opacity-100"
          >
            <Pencil size={16} />
          </button>
        </CardDescription>
        <SuccessAlert success={success} />
        <ErrorAlert error={error} />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Button
                      variant={"link"}
                      size={"sm"}
                      onClick={handleForgetPassword}
                      type="button"
                      className="ml-auto text-sm "
                    >
                      Forgot your password?
                    </Button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="shadcn"
                        className="pr-10"
                        type={seePassword ? "text" : "password"}
                        {...field}
                      />
                      <Button
                        onClick={() => setSeePassword((prev) => !prev)}
                        type="button"
                        className="absolute hover:bg-transparent top-0 right-0"
                        size={"icon"}
                        variant={"ghost"}
                      >
                        {seePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader size={17} className="animate-spin" />
              ) : (
                "Login"
              )}
            </Button>
          </form>
          <Button variant={"link"} type="button" onClick={() => router.back()}>
            Back
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
};
export default FactorOneForm;
