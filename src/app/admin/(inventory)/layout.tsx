"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: "Add Product", href: "/admin/add-product" },
    { label: "Manage Products", href: "/admin/manage-product" },
    { label: "Manage Categories", href: "/admin/manage-categories" },
  ];

  return (
    <main>
      <nav className="flex space-x-4 border-b border-gray-200 p-4 justify-end">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} passHref>
              <span
                className={`
                  inline-block px-4 py-2 text-sm font-medium cursor-pointer
                  ${
                    isActive
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-600 hover:text-gray-800"
                  }
                `}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4">{children}</div>
    </main>
  );
}
