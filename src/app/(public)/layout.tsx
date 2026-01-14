import type { ReactNode } from "react";
import Footer from "@/shared/components/home/footer";
import Header from "@/shared/components/home/header";
import BottomNav from "@/shared/components/mobile/BottomNav";
import LivePurchaseNotification from "@/shared/components/trust/LivePurchaseNotification";

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
      <BottomNav />
      <LivePurchaseNotification />
    </>
  );
}
