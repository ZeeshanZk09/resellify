import type { ReactNode } from "react";
import Footer from "@/shared/components/home/footer";
import Header from "@/shared/components/home/header";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="w-full min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
