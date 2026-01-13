import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import AdminNavbar from "@/shared/components/admin/AdminNavbar";
import AdminSidebar from "@/shared/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  console.log("session in admin route:", session);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="w-full relative flex flex-col min-h-screen overflow-hidden">
      <AdminNavbar name={session?.user?.name!} />
      <div className="w-full flex flex-1 items-start h-full">
        <div className="flex justify-between flex-1 h-full">
          <AdminSidebar />
          <div className="relative left-12 max-w-[90vw] w-full px-6 border-l border-foreground/05 py-14">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
