import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import FactorOneForm from "@/shared/components/auth/factor-one-form";

const page = async () => {
  const email = (await cookies())?.get("login_email")?.value;
  console.log(email);
  if (!email) redirect("/auth/sign-in");
  return <FactorOneForm email={email} />;
};

export default page;
