"use client";
import ThemeSwitch from "../theme-switch";
import { usePathname } from "next/navigation";
import { useMobile } from "@/shared/utils/useMobile";

const Footer = () => {
  const pathname = usePathname();
  const isMobile = useMobile();
  // Hide header for any route under /shop
  const isShopRoute = pathname?.startsWith("/shop");

  if (isShopRoute && isMobile) return null;

  console.log("pathname", pathname);
  return (
    <footer className="bg-card text-foreground text-sm">
      <div className="p-5 max-w-7xl mx-auto flex  justify-between items-center">
        <p>
          &copy; 2025 NextAuth Starter. Built by{" "}
          <a href="https://bendadaabdelmajid.netlify.app/">
            Abdelmajid Bendada.
          </a>
        </p>
        <ThemeSwitch className="ml-auto" />
      </div>
    </footer>
  );
};

export default Footer;
