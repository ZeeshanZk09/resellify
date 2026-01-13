"use client";
import DeleteAccount from "@/shared/components/profile/delete-account";
import EmailForm from "@/shared/components/profile/email-form";
import ManageAccount from "@/shared/components/profile/manage-account";
import PasswordForm from "@/shared/components/profile/password-form";
import ProfileForm from "@/shared/components/profile/profile-form";
import UserButton from "@/shared/components/profile/user-btn";

export default function Dashboard() {
  return (
    <section className="min-h-screen w-full flex p-6 flex-col justify-center items-center gap-10 mx-auto">
      <ProfileForm />
      {/* <UserButton />
      <ManageAccount open={false} setOpen={() => {}} />
      <EmailForm cancel={() => {}} />
      <PasswordForm />
      <DeleteAccount /> */}
    </section>
  );
}
