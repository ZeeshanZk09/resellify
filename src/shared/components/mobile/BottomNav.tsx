"use client";

import { Grid3x3, Home, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  active?: boolean;
}

function NavItem({ href, icon: Icon, label, badge, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 relative transition-colors",
        active ? "text-green-600" : "text-gray-600 hover:text-gray-900",
      )}
      aria-label={label}
    >
      <div className="relative">
        <Icon className={cn("w-6 h-6", active && "stroke-[2.5px]")} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className={cn("text-xs font-medium", active && "font-semibold")}>
        {label}
      </span>
      {active && (
        <div className="absolute -bottom-1 w-12 h-1 bg-green-600 rounded-full" />
      )}
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Fetch cart count from API or local storage
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart/count");
        const data = await response.json();
        setCartCount(data.count || 0);
      } catch (error) {
        // Fallback to localStorage
        const cart = localStorage.getItem("cart");
        if (cart) {
          const items = JSON.parse(cart);
          setCartCount(items.length);
        }
      }
    };

    fetchCartCount();

    // Listen for cart updates
    const handleCartUpdate = (event: CustomEvent) => {
      setCartCount(event.detail.count);
    };

    window.addEventListener("cart-updated", handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdate as EventListener,
      );
    };
  }, []);

  // Hide on desktop
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Fixed Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        <div className="grid grid-cols-5 h-16 max-w-7xl mx-auto">
          <NavItem
            href="/"
            icon={Home}
            label="Home"
            active={pathname === "/"}
          />
          <NavItem
            href="/shop"
            icon={Grid3x3}
            label="Categories"
            active={
              pathname.startsWith("/shop") || pathname.startsWith("/category")
            }
          />
          <NavItem
            href="/search"
            icon={Search}
            label="Search"
            active={pathname === "/search"}
          />
          <NavItem
            href="/bag"
            icon={ShoppingCart}
            label="Cart"
            badge={cartCount}
            active={pathname === "/bag"}
          />
          <NavItem
            href="/dashboard"
            icon={User}
            label="Account"
            active={
              pathname.startsWith("/dashboard") ||
              pathname.startsWith("/profile")
            }
          />
        </div>
      </nav>
    </>
  );
}
